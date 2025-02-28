import type {
  //   CanvasManagerInterface,
  //   CanvasManagerOptions,
  //   ReplayEventWithTime,
  RrwebRecordOptions,
} from "./rrweb";

export type RecordingOptions = RrwebRecordOptions;

export interface ReplayNetworkOptions {
  /**
   * Capture request/response details for XHR/Fetch requests that match the given URLs.
   * The URLs can be strings or regular expressions.
   * When provided a string, we will match any URL that contains the given string.
   * You can use a Regex to handle exact matches or more complex matching.
   *
   * Only URLs matching these patterns will have bodies & additional headers captured.
   */
  networkDetailAllowUrls: (string | RegExp)[];

  /**
   * Deny request/response details for XHR/Fetch requests that match the given URLs.
   * The URLs can be strings or regular expressions.
   * When provided a string, we will deny any URL that contains the given string.
   * You can use a Regex to handle exact matches or more complex matching.
   * URLs matching these patterns will not have bodies & additional headers captured.
   */
  networkDetailDenyUrls: (string | RegExp)[];

  /**
   * If request & response bodies should be captured.
   * Only applies to URLs matched by `networkDetailAllowUrls` and not matched by `networkDetailDenyUrls`.
   * Defaults to true.
   */
  networkCaptureBodies: boolean;

  /**
   * Capture the following request headers, in addition to the default ones.
   * Only applies to URLs matched by `networkDetailAllowUrls` and not matched by `networkDetailDenyUrls`.
   * Any headers defined here will be captured in addition to the default headers.
   */
  networkRequestHeaders: string[];

  /**
   * Capture the following response headers, in addition to the default ones.
   * Only applies to URLs matched by `networkDetailAllowUrls` and not matched by `networkDetailDenyUrls`.
   * Any headers defined here will be captured in addition to the default headers.
   */
  networkResponseHeaders: string[];
}

export interface ReplayPluginOptions extends ReplayNetworkOptions {
  /**
   * If false, will create a new session per pageload. Otherwise, saves session
   * to Session Storage.
   */
  stickySession: boolean;

  /**
   * The amount of time to wait before sending a replay
   */
  flushMinDelay: number;

  /**
   * The max amount of time to wait before sending a replay
   */
  flushMaxDelay: number;

  /**
   * Attempt to use compression when web workers are available
   *
   * (default is true)
   */
  useCompression: boolean;

  /**
   * If defined, use this worker URL instead of the default included one for compression.
   * This will only be used if `useCompression` is not false.
   */
  workerUrl?: string;

  /**
   * Block all media (e.g. images, svg, video) in recordings.
   */
  blockAllMedia: boolean;

  /**
   * Mask all inputs in recordings
   */
  maskAllInputs: boolean;

  /**
   * Mask all text in recordings
   */
  maskAllText: boolean;

  /**
   * A high number of DOM mutations (in a single event loop) can cause
   * performance regressions in end-users' browsers. This setting will create
   * a breadcrumb in the recording when the limit has been reached.
   */
  mutationBreadcrumbLimit: number;

  /**
   * A high number of DOM mutations (in a single event loop) can cause
   * performance regressions in end-users' browsers. This setting will cause
   * recording to stop when the limit has been reached.
   */
  mutationLimit: number;

  /**
   * The max. time in ms to wait for a slow click to finish.
   * After this amount of time we stop waiting for actions after a click happened.
   * Set this to 0 to disable slow click capture.
   *
   * Default: 7000ms
   */
  slowClickTimeout: number;

  /**
   * Ignore clicks on elements matching the given selectors for slow click detection.
   */
  slowClickIgnoreSelectors: string[];

  /**
   * The min. duration (in ms) a replay has to have before it is sent to Sentry.
   * Whenever attempting to flush a session that is shorter than this, it will not actually send it to Sentry.
   * Note that this is capped at max. 15s.
   */
  minReplayDuration: number;

  /**
   * The max. duration (in ms) a replay session may be.
   * This is capped at max. 60min.
   */
  maxReplayDuration: number;
}

export type InitialReplayPluginOptions = Omit<
  ReplayPluginOptions,
  "sessionSampleRate" | "errorSampleRate"
>;
