import type {
  RecordingOptions,
  ReplayOptions,
  ReplayConfiguration,
} from "./types";
import { ReplayContainer } from "./replay";
import {
  DEFAULT_FLUSH_MAX_DELAY,
  DEFAULT_FLUSH_MIN_DELAY,
  MAX_REPLAY_DURATION,
  MIN_REPLAY_DURATION,
  MIN_REPLAY_DURATION_LIMIT,
  API_URI,
} from "./constants";

const MEDIA_SELECTORS =
  'img,image,svg,video,object,picture,embed,map,audio,link[rel="icon"],link[rel="apple-touch-icon"]';

const DEFAULT_NETWORK_HEADERS = ["content-length", "content-type", "accept"];

/**
 * 通过这种方式可以防止重复初始化
 */
let _initialized = false;

export class Replay {
  static id = "Replay";
  name: string;

  url: string = "";

  /**
   * 传递给 `rrweb.record()` 的选项
   */
  private readonly _recordingOptions: RecordingOptions;
  /**
   * 初始化需要传递的配置
   */
  private readonly _initialOptions: ReplayOptions;

  private _replay?: ReplayContainer;

  constructor({
    // 向服务器发送录制事件的延迟时间
    flushMinDelay = DEFAULT_FLUSH_MIN_DELAY,
    flushMaxDelay = DEFAULT_FLUSH_MAX_DELAY,

    // 设置回放的最小和最大时长
    minReplayDuration = MIN_REPLAY_DURATION,
    maxReplayDuration = MAX_REPLAY_DURATION,

    // 如果设置为 true，则会话在录制期间会维持一致的 sessionId，
    // 这意味着如果用户重新加载页面或者进行其他操作，会话不会中断
    stickySession = true,
    // 是否启用压缩，数据会在发送前进行压缩
    useCompression = true,

    // worker 脚本的 URL，将会话录制工作转移到 Web Worker 中，以减轻主线程的负担
    workerUrl,

    // 保护用户隐私
    maskAllText = true,
    maskAllInputs = true,
    // 阻止所有嵌入的媒体元素（如 <video>、<audio>）
    blockAllMedia = true,

    // 控制最大记录的 DOM 变更数量
    mutationBreadcrumbLimit = 750,
    // 控制记录的最大变更数，限制一次性记录的变更数量
    mutationLimit = 10_000,

    // “慢点击”的超时时间,如果点击时间超过此值，将被标记为慢点击。
    slowClickTimeout = 7_000,
    // 忽略慢点击判断的 CSS 选择器数组
    slowClickIgnoreSelectors = [],

    // 符合这些 URL 的网络请求会被详细记录
    networkDetailAllowUrls = [],
    // 符合这些 URL 的网络请求会被忽略
    networkDetailDenyUrls = [],
    // 是否捕获请求和响应的主体
    networkCaptureBodies = true,
    // 指定哪些请求头需要被记录
    networkRequestHeaders = [],
    // 指定哪些响应头需要被记录
    networkResponseHeaders = [],

    // 用于进一步细化屏蔽、忽略、阻止记录、解锁的元素或属性

    mask = [],
    // 指定需要屏蔽的元素属性
    maskAttributes = ["title", "placeholder"],
    // 指定不被屏蔽的元素
    unmask = [],
    // 指定需要被阻止记录的元素
    block = [],
    // 指定允许记录的元素
    unblock = [],
    // 指定忽略记录的元素
    ignore = [],
    // 自定义函数，用于自定义文本和元素的屏蔽规则
    maskFn,
    url = "",
    onData = () => {},
  }: ReplayConfiguration = {}) {
    this.name = Replay.id;

    if (!url) {
      console.error(new Error("replay sdk 加载失败，请填写服务器url"));
      return;
    }

    this.url = normalizeUrl(url + API_URI);

    this._recordingOptions = {
      maskAllInputs,
      maskAllText,
      maskTextFn: maskFn,
      maskInputFn: maskFn,

      /**
       * 控制 rrweb 录制时对 DOM 结构的精简程度
       * @default 'all' 表示对整个 DOM 进行精简
       */
      slimDOMOptions: "all",
      // 是否将样式表内联到 HTML 中，这样做可以确保回放时样式正确应用
      inlineStylesheet: true,

      // 是否将图片以 base64 格式内联到录制数据中
      inlineImages: false,
      // 是否收集字体信息
      collectFonts: true,
      errorHandler: (err: Error & { __rrweb__?: boolean }) => {
        try {
          err.__rrweb__ = true;
        } catch (error) {}
      },
    };

    this._initialOptions = {
      flushMinDelay,
      flushMaxDelay,
      minReplayDuration: Math.min(minReplayDuration, MIN_REPLAY_DURATION_LIMIT),
      maxReplayDuration: Math.min(maxReplayDuration, MAX_REPLAY_DURATION),

      stickySession,
      useCompression,
      workerUrl,

      blockAllMedia,
      maskAllInputs,
      maskAllText,

      mutationBreadcrumbLimit,
      mutationLimit,

      slowClickTimeout,
      slowClickIgnoreSelectors,
      networkDetailAllowUrls,
      networkDetailDenyUrls,
      networkCaptureBodies,
      networkRequestHeaders: _getMergedNetworkHeaders(networkRequestHeaders),
      networkResponseHeaders: _getMergedNetworkHeaders(networkResponseHeaders),

      url: this.url,
      onData,
    };

    // if (this._initialOptions.blockAllMedia) {
    //   // 阻止媒体元素
    //   this._recordingOptions.blockSelector = !this._recordingOptions
    //     .blockSelector
    //     ? MEDIA_SELECTORS
    //     : `${this._recordingOptions.blockSelector},${MEDIA_SELECTORS}`;
    // }

    // 防止重复初始化
    if (this._isInitialized && isBrowser()) {
      throw new Error("不支持多个会话重放");
    }

    this._isInitialized = true;
  }

  protected get _isInitialized(): boolean {
    return _initialized;
  }

  protected set _isInitialized(value: boolean) {
    _initialized = value;
  }

  start() {}

  init() {
    if (!isBrowser() || this._replay || !this.url) return;

    this._replay = new ReplayContainer({
      options: this._initialOptions,
      recordingOptions: this._recordingOptions,
    });

    // this._maybeLoadFromReplayCanvasIntegration(client);

    this._replay.init();
  }

  /**
   * 处理回放的模式转换，非 session 模式下 触发 flush（数据刷新）
   *
   * - 如果当前处于 session 模式，直接立即刷新数据；
   * - 如果是非 session 模式，则将数据刷新（flush），
   * 并重新以 session 模式启动录制（如果 continueRecording 为 true）
   */
  public flush(options?: SendBufferedReplayOptions): Promise<void> {
    if (!this._replay) {
      return Promise.resolve();
    }

    // assuming a session should be recorded in this case
    if (!this._replay.isEnabled()) {
      this._replay.start();
      return Promise.resolve();
    }

    return this._replay.sendBufferedReplayOrFlush(options);
  }
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function _getMergedNetworkHeaders(headers: string[]): string[] {
  return [
    ...DEFAULT_NETWORK_HEADERS,
    ...headers.map((header) => header.toLowerCase()),
  ];
}

function normalizeUrl(url: string): string {
  return url.replace(/([^:])\/{2,}/g, "$1/");
}
