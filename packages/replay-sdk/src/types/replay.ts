import type {
  CanvasManagerInterface,
  CanvasManagerOptions,
  ReplayEventWithTime,
  RrwebRecordOptions,
} from "./rrweb";

export type RecordingOptions = RrwebRecordOptions;

export interface ReplayNetworkOptions {
  /**
   * 指定允许捕获的 XHR/Fetch 请求 URL，支持字符串和正则表达式。
   */
  networkDetailAllowUrls: (string | RegExp)[];

  /**
   * 指定拒绝捕获的 XHR/Fetch 请求 URL，支持字符串和正则表达式。
   */
  networkDetailDenyUrls: (string | RegExp)[];

  /**
   * 是否记录请求和响应的 body
   * 仅适用于允许捕获且 不被排除的请求
   * @default true
   */
  networkCaptureBodies: boolean;

  /**
   * 指定要额外捕获的请求头字段（除了默认字段）
   */
  networkRequestHeaders: string[];

  /**
   * 指定要额外捕获的响应头字段（除了默认字段）。
   */
  networkResponseHeaders: string[];
}

export interface ReplayOptions extends ReplayNetworkOptions {
  /**
   * 是否在 session Storage 中保存会话
   */
  stickySession: boolean;

  /**
   * 最短的回放数据上传间隔（单位：毫秒）
   */
  flushMinDelay: number;

  /**
   * 最长的回放数据上传间隔（单位：毫秒）
   */
  flushMaxDelay: number;

  /**
   * 是否启用数据压缩（支持worker）
   *
   * @default true
   */
  useCompression: boolean;

  /**
   *  Web Worker 的 URL
   */
  workerUrl?: string;

  /**
   * 是否屏蔽所有媒体内容（如图片、SVG、视频等）
   */
  blockAllMedia: boolean;

  /**
   * 是否隐藏所有输入框内容
   */
  maskAllInputs: boolean;

  /**
   * 是否隐藏页面上的所有文本
   */
  maskAllText: boolean;

  /**
   * DOM 变更过多时，添加一条日志
   * 只用于警告，不会影响录制
   */
  mutationBreadcrumbLimit: number;

  /**
   * DOM 变更过多时，直接停止录制
   * 过多的 DOM 变更可能导致性能问题，因此需要一个上限
   */
  mutationLimit: number;

  /**
   * 慢点击的最长等待时间
   *
   * @default 7000ms
   */
  slowClickTimeout: number;

  /**
   * 不触发慢点击检测的元素选择器
   */
  slowClickIgnoreSelectors: string[];

  /**
   * 最短的录制时长 ms
   */
  minReplayDuration: number;

  /**
   * 最长的录制时长 ms
   */
  maxReplayDuration: number;
}

type OptionalReplayOptions = Partial<ReplayOptions> & {
  /**
   * Mask element attributes that are contained in list
   */
  maskAttributes?: string[];
};

export interface ReplayPrivacyOptions {
  /**
   * Mask text content for elements that match the CSS selectors in the list.
   */
  mask?: string[];

  /**
   * Unmask text content for elements that match the CSS selectors in the list.
   */
  unmask?: string[];

  /**
   * Block elements that match the CSS selectors in the list. Blocking replaces
   * the element with an empty placeholder with the same dimensions.
   */
  block?: string[];

  /**
   * Unblock elements that match the CSS selectors in the list. This is useful when using `blockAllMedia`.
   */
  unblock?: string[];

  /**
   * Ignore input events for elements that match the CSS selectors in the list.
   */
  ignore?: string[];

  /**
   * A callback function to customize how your text is masked.
   */
  maskFn?: (s: string) => string;
}
export interface ReplayConfiguration
  extends ReplayPrivacyOptions,
    OptionalReplayOptions,
    Pick<RecordingOptions, "maskAllText" | "maskAllInputs"> {
  /**
   * 后端服务部署url
   */
  url?: string;
}

export type RecordingEvent = ReplayFrameEvent | ReplayEventWithTime;

export type ReplayRecordingData = string | Uint8Array;

export type EventBufferType = "sync" | "worker";

export interface ReplayCanvasOptions {
  enableManualSnapshot?: boolean;
  recordCanvas: true;
  getCanvasManager: (options: CanvasManagerOptions) => CanvasManagerInterface;
  sampling: {
    canvas: number;
  };
  dataURLOptions: {
    type: string;
    quality: number;
  };
}

export interface EventBuffer {
  /**
   * If any events have been added to the buffer.
   */
  readonly hasEvents: boolean;

  /**
   * The buffer type
   */
  readonly type: EventBufferType;

  /**
   * If the event buffer contains a checkout event.
   */
  hasCheckout: boolean;

  /**
   * Destroy the event buffer.
   */
  destroy(): void;

  /**
   * Clear the event buffer.
   */
  clear(): void;

  /**
   * Add an event to the event buffer.
   *
   * Returns a promise that resolves if the event was successfully added, else rejects.
   */
  addEvent(event: RecordingEvent): Promise<AddEventResult>;

  /**
   * Clears and returns the contents of the buffer.
   */
  finish(): Promise<ReplayRecordingData>;

  /**
   * Get the earliest timestamp in ms of any event currently in the buffer.
   */
  getEarliestTimestamp(): number | null;
}

export type AddEventResult = void;

export interface Timeouts {
  sessionIdlePause: number;
  sessionIdleExpire: number;
}

export type ReplayRecordingMode = "session" | "buffer";

export interface Session {
  id: string;

  /**
   * Start time of current session (in ms)
   */
  started: number;

  /**
   * Last known activity of the session (in ms)
   */
  lastActivity: number;

  /**
   * Segment ID for replay events
   */
  segmentId: number;

  /**
   * The ID of the previous session.
   * If this is empty, there was no previous session.
   */
  previousSessionId?: string;

  /**
   * Is the session sampled? `false` if not sampled, otherwise, `session` or `buffer`
   */
  sampled: Sampled;
}

export interface SessionOptions
  extends Pick<ReplayPluginOptions, "sessionSampleRate" | "stickySession"> {
  /**
   * Should buffer recordings to be saved later either by error sampling, or by
   * manually calling `flush()`. This is only a factor if not sampled for a
   * session-based replay.
   */
  allowBuffering: boolean;
}

export interface WorkerRequest {
  id: number;
  method: "clear" | "addEvent" | "finish";
  arg?: string;
}

export interface WorkerResponse {
  id: number;
  method: string;
  success: boolean;
  response: unknown;
}

export interface SendReplayData {
  recordingData: ReplayRecordingData;
  replayId: string;
  segmentId: number;
  eventContext: PopEventContext;
  timestamp: number;
  session: Session;
  options: ReplayPluginOptions;
}

export type AddUpdateCallback = () => boolean | void;

export interface ReplayContainer {
  eventBuffer: EventBuffer | null;
  clickDetector: ReplayClickDetector | undefined;
  /**
   * List of PerformanceEntry from PerformanceObservers.
   */
  performanceEntries: AllPerformanceEntry[];

  /**
   * List of already processed performance data, ready to be added to replay.
   */
  replayPerformanceEntries: ReplayPerformanceEntry<AllPerformanceEntryData>[];
  session: Session | undefined;
  recordingMode: ReplayRecordingMode;
  timeouts: Timeouts;
  throttledAddEvent: (
    event: RecordingEvent,
    isCheckout?: boolean
  ) => typeof THROTTLED | typeof SKIPPED | Promise<AddEventResult | null>;
  isEnabled(): boolean;
  isPaused(): boolean;
  isRecordingCanvas(): boolean;
  getContext(): InternalEventContext;
  initializeSampling(): void;
  start(): void;
  stop(options?: { reason?: string; forceflush?: boolean }): Promise<void>;
  pause(): void;
  resume(): void;
  startRecording(): void;
  stopRecording(): boolean;
  sendBufferedReplayOrFlush(options?: SendBufferedReplayOptions): Promise<void>;
  conditionalFlush(): Promise<void>;
  flush(): Promise<void>;
  flushImmediate(): Promise<void>;
  cancelFlush(): void;
  triggerUserActivity(): void;
  updateUserActivity(): void;
  addUpdate(cb: AddUpdateCallback): void;
  getOptions(): ReplayPluginOptions;
  getSessionId(): string | undefined;
  checkAndHandleExpiredSession(): boolean | void;
  setInitialState(): void;
  getCurrentRoute(): string | undefined;
  handleException(err: unknown): void;
}
