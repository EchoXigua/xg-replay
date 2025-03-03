import { record } from "rrweb";

import {
  BUFFER_CHECKOUT_TIME,
  SESSION_IDLE_EXPIRE_DURATION,
  SESSION_IDLE_PAUSE_DURATION,
  SLOW_CLICK_SCROLL_TIMEOUT,
  SLOW_CLICK_THRESHOLD,
} from "./constants";
import {
  Timeouts,
  RecordingEvent,
  RecordingOptions,
  ReplayRecordingMode,
  AddEventResult,
  Session,
} from "./types";

import { debounce } from "./utils/debounce";
import { THROTTLED, throttle } from "./utils/throttle";
import type { SKIPPED } from "./utils/throttle";
import { addEvent, addEventSync } from "./utils/addEvent";
import { isExpired } from "./utils";
import { getHandleRecordingEmit } from "./utils/handleRecordingEmit";

import { shouldRefreshSession } from "./session/shouldRefreshSession";
import { clearSession } from "./session/clearSession";
import { loadOrCreateSession } from "./session/loadOrCreateSession";
import { saveSession } from "./session";
import { createEventBuffer } from "./eventBuffer";

export class ReplayContainer {
  eventBuffer: EventBuffer | null;

  /**
   * 传递给 `rrweb.record()` 的配置
   */
  private readonly _recordingOptions: RecordingOptions;

  private _options: InternalReplayPluginOptions;

  /**
   * Recording can happen in one of three modes:
   *   - session: Record the whole session, sending it continuously
   *   - buffer: Always keep the last 60s of recording, requires:
   *     - having replaysOnErrorSampleRate > 0 to capture replay when an error occurs
   *     - or calling `flush()` to send the replay
   */
  public recordingMode: ReplayRecordingMode;

  public session: Session | undefined;

  /**
   * These are here so we can overwrite them in tests etc.
   * @hidden
   */
  public readonly timeouts: Timeouts;

  /**
   * 记录最近一次用户交互的时间，用于判断是否需要暂停或终止会话
   */
  private _lastActivity: number;

  /**
   * 回放功能是否启用
   */
  private _isEnabled: boolean;

  /**
   * 当前回放是否被暂停
   * 不在监听 DOM
   * 不在向缓冲区添加事件
   */
  private _isPaused: boolean;

  /** 是否需要手动启动录制（ */
  private _requiresManualStart: boolean;

  /**
   * Have we attached listeners to the core SDK?
   * Note we have to track this as there is no way to remove instrumentation handlers.
   */
  private _hasInitializedCoreListeners: boolean;

  /**
   * Function to stop recording
   */
  private _stopRecording: ReturnType<typeof record> | undefined;

  private _context: InternalEventContext;

  private _throttledAddEvent: (
    event: RecordingEvent,
    isCheckout?: boolean
  ) => typeof THROTTLED | typeof SKIPPED | Promise<AddEventResult | null>;

  /**
   * 防抖的刷新操作,用于合并多个连续触发的 _flush 调用，避免短时间内过于频繁地上传数据
   */
  private _debouncedFlush: ReturnType<typeof debounce>;
  private _flushLock: Promise<unknown> | undefined;

  constructor({
    recordingOptions,
    options,
  }: {
    recordingOptions: RecordingOptions;
    options: InternalReplayPluginOptions;
  }) {
    this.eventBuffer = null;
    this.recordingMode = "session";
    this.timeouts = {
      sessionIdlePause: SESSION_IDLE_PAUSE_DURATION,
      sessionIdleExpire: SESSION_IDLE_EXPIRE_DURATION,
    } as const;

    this._lastActivity = Date.now();
    this._isEnabled = false;
    this._isPaused = false;
    this._requiresManualStart = false;
    this._hasInitializedCoreListeners = false;

    this._context = {
      errorIds: new Set(),
      traceIds: new Set(),
      urls: [],
      initialTimestamp: Date.now(),
      initialUrl: "",
    };

    this._recordingOptions = recordingOptions;
    this._options = options;

    this._debouncedFlush = debounce(
      () => this._flush(),
      this._options.flushMinDelay,
      {
        maxWait: this._options.flushMaxDelay,
      }
    );

    this._throttledAddEvent = throttle(
      (event: RecordingEvent, isCheckout?: boolean) =>
        addEvent(this, event, isCheckout),
      // Max 300 events...
      300,
      // ... per 5s
      5
    );
  }

  /** Get the event context. */
  public getContext(): InternalEventContext {
    return this._context;
  }

  public isEnabled(): boolean {
    return this._isEnabled;
  }

  public isPaused(): boolean {
    return this._isPaused;
  }

  init(previousSessionId?: string): void {
    // 初始化会话
    this._initSession(previousSessionId);

    if (!this.session) {
      console.error(new Error("初始化的时候不能创建会话"));
      return;
    }

    if (this.session.sampled === false) {
      return;
    }

    /**
     * 设置录制模式
     * 1. false → 不会采样（前面已经 return）
     * 2. "buffer" → 缓冲模式（仅记录部分数据）
     * 3. "session" → 完整录制
     */
    this.recordingMode =
      this.session.sampled === "buffer" && this.session.segmentId === 0
        ? "buffer"
        : "session";

    console.info(`Starting replay in ${this.recordingMode} mode`);

    this._initRecording();
  }

  private _initSession(previousSessionId?: string): void {
    const session = loadOrCreateSession(
      {
        sessionIdleExpire: this.timeouts.sessionIdleExpire,
        maxReplayDuration: this._options.maxReplayDuration,
        previousSessionId,
      },
      {
        stickySession: this._options.stickySession,
        sessionSampleRate: this._options.sessionSampleRate,
        allowBuffering: true,
      }
    );

    this.session = session;
  }

  /**
   * Initialize and start all listeners to varying events (DOM,
   * Performance Observer, Recording, Sentry SDK, etc)
   */
  private _initRecording(): void {
    this.setInitialState();

    // 更新当前会话的活动状态
    this._updateSessionActivity();

    this.eventBuffer = createEventBuffer({
      useCompression: this._options.useCompression,
      workerUrl: this._options.workerUrl,
    });

    // this._removeListeners();
    // this._addListeners();

    // 需要在开始记录之前设置为启用 因为 `record()` 能够触发刷新
    this._isEnabled = true;
    this._isPaused = false;

    this.startRecording();
  }

  /** 启动录制 */
  public startRecording(): void {
    try {
      // 获取 canvas 相关的配置
      const canvasOptions = this._canvas;

      // 调用录制函数
      this._stopRecording = record({
        // 基础的录制配置项
        ...this._recordingOptions,
        // 如果当前录制模式是 "buffer"，即为 错误采样模式
        // 不会一直录制，防止内存泄漏
        // 会记录最近 60 秒的回放数据，以便捕获错误前的最后状态
        ...(this.recordingMode === "buffer" && {
          // 设置录制时的切换间隔
          checkoutEveryNms: BUFFER_CHECKOUT_TIME,
        }),

        // 处理录制事件的回调函数，用来发送或处理录制事件
        emit: (event: RecordingEvent, _isCheckout?: boolean) => {
          console.log("emit", event, _isCheckout);
        },
        // emit: getHandleRecordingEmit(this),
        // 处理 DOM 变更或其他变动
        onMutation: this._onMutationHandler,
        ...(canvasOptions
          ? {
              recordCanvas: canvasOptions.recordCanvas, // 是否录制 Canvas 内容
              getCanvasManager: canvasOptions.getCanvasManager, //  获取管理 Canvas 的方法
              sampling: canvasOptions.sampling, // 用于控制录制数据的精度
              dataURLOptions: canvasOptions.dataURLOptions, // 用于生成 Canvas 的数据 URL 配置
            }
          : {}),
      });
    } catch (err) {
      //   this.handleException(err);
    }
  }

  /**
   * 将录制的数据上传到服务器
   * 创建一个锁，以确保同一时间只有一个刷新操作可以处于活动状态
   */
  private _flush = async ({
    force = false,
  }: {
    /**
     *
     * 如果为true 无论 _isEnabled 状态如何，都会强制执行刷新。
     */
    force?: boolean;
  } = {}): Promise<void> => {
    if (!this._isEnabled && !force) {
      return;
    }

    // 检查当前会话是否已过期
    if (!this.checkAndHandleExpiredSession()) {
      return;
    }

    if (!this.session) {
      return;
    }

    // 计算当前会话的时长
    const start = this.session.started;
    const now = Date.now();
    const duration = now - start;

    // 取消所有已排队的刷新操作，确保当前这次 _flush 是最新的
    this._debouncedFlush.cancel();

    /**
     * 如果会话太短或太长，都不执行刷新逻辑
     * - 太短：可能是误触发的回放，不值得上传，避免浪费带宽。
     * - 太长：可能是异常情况，不适合上传。
     */
    const tooShort = duration < this._options.minReplayDuration;
    const tooLong = duration > this._options.maxReplayDuration + 5_000; //  允许 5 秒误差
    if (tooShort || tooLong) {
      // 如果会话太短，就重新排队
      if (tooShort) {
        this._debouncedFlush();
      }
      return;
    }

    // 并发锁，防止同时执行多个 _flush()
    if (!this._flushLock) {
      this._flushLock = this._runFlush();

      // 刷新完成后，清除锁并返回，避免重复执行
      await this._flushLock;
      this._flushLock = undefined;
      return;
    }

    // 存在锁，另一个 _flush 任务正在进行
    try {
      // 等待该任务完成
      await this._flushLock;
    } catch (err) {
      console.error(err);
    } finally {
      // 触发后续的刷新请求
      this._debouncedFlush();
    }
  };

  /** 检查会话是否过期 */
  checkAndHandleExpiredSession(): boolean | void {
    if (
      this._lastActivity &&
      isExpired(this._lastActivity, this.timeouts.sessionIdlePause) &&
      this.session &&
      this.session.sampled === "session"
    ) {
      // 暂停回放录制，避免记录无用的回放数据
      this.pause();
      return;
    }

    // 如果用户近期有活动，检查是否需要刷新会话
    if (!this._checkSession()) {
      return false;
    }

    return true;
  }

  private _checkSession(): boolean {
    if (!this.session) {
      return false;
    }

    const currentSession = this.session;

    // 判断会话是否需要刷新
    if (
      shouldRefreshSession(currentSession, {
        sessionIdleExpire: this.timeouts.sessionIdleExpire,
        maxReplayDuration: this._options.maxReplayDuration,
      })
    ) {
      this._refreshSession(currentSession);
      return false;
    }

    // 会话有效
    return true;
  }

  private async _refreshSession(session: Session): Promise<void> {
    if (!this._isEnabled) {
      return;
    }
    await this.stop({ reason: "刷新会话" });
    this.init(session.id);
  }

  /**
   * 与 stop() 不同，仅停止 DOM 记录，而不会像 stop() 那样彻底关闭所有功能
   */
  public pause(): void {
    if (this._isPaused) {
      return;
    }

    this._isPaused = true;
    this.stopRecording();
    console.info("暂停录制");
  }

  /**
   * 用于停止当前的录制操作
   */
  public stopRecording(): boolean {
    try {
      if (this._stopRecording) {
        this._stopRecording();
        this._stopRecording = undefined;
      }

      return true;
    } catch (err) {
      //   this.handleException(err);
      return false;
    }
  }

  /**
   * 用于手动停止回放功能
   */
  public async stop({
    forceFlush = false,
    reason,
  }: { forceFlush?: boolean; reason?: string } = {}): Promise<void> {
    if (!this._isEnabled) {
      return;
    }

    // 禁用回放
    this._isEnabled = false;

    try {
      console.info(`Stopping Replay${reason ? ` triggered by ${reason}` : ""}`);

      //   this._removeListeners();
      this.stopRecording();

      // 取消上传
      this._debouncedFlush.cancel();
      if (forceFlush) {
        // 强制刷新.确保收集的数据被上传
        await this._flush({ force: true });
      }

      // 释放缓冲区资源
      this.eventBuffer && this.eventBuffer.destroy();
      this.eventBuffer = null;

      // 清理会话
      // 稍后启动新的 Replay 录制，就不会保留 之前的 session ID
      clearSession(this);
    } catch (err) {
      //   this.handleException(err);
    }
  }

  /**
   * 初始化状态
   */
  public setInitialState(): void {
    const urlPath = `${window.location.pathname}${window.location.hash}${window.location.search}`;
    const url = `${window.location.origin}${urlPath}`;

    // this.performanceEntries = [];
    // this.replayPerformanceEntries = [];

    this._clearContext();

    this._context.initialUrl = url;
    this._context.initialTimestamp = Date.now();
    this._context.urls.push(url);
  }

  private _clearContext(): void {
    this._context.errorIds.clear();
    this._context.traceIds.clear();
    this._context.urls = [];
  }

  private _updateSessionActivity(_lastActivity: number = Date.now()): void {
    if (this.session) {
      this.session.lastActivity = _lastActivity;
      this._maybeSaveSession();
    }
  }

  /** 保存会话到本地 */
  private _maybeSaveSession(): void {
    if (this.session && this._options.stickySession) {
      saveSession(this.session);
    }
  }

  /**
   * Adds listeners to record events for the replay
   */
  private _addListeners(): void {
    try {
      WINDOW.document.addEventListener(
        "visibilitychange",
        this._handleVisibilityChange
      );
      WINDOW.addEventListener("blur", this._handleWindowBlur);
      WINDOW.addEventListener("focus", this._handleWindowFocus);
      WINDOW.addEventListener("keydown", this._handleKeyboardEvent);

      if (this.clickDetector) {
        this.clickDetector.addListeners();
      }

      // There is no way to remove these listeners, so ensure they are only added once
      if (!this._hasInitializedCoreListeners) {
        addGlobalListeners(this);

        this._hasInitializedCoreListeners = true;
      }
    } catch (err) {
      this.handleException(err);
    }

    this._performanceCleanupCallback = setupPerformanceObserver(this);
  }
}
