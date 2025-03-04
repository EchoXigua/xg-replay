/** 最小发送延迟，意味着 rrweb 至少每 5 秒会将录制的事件推送到服务器 */
export const DEFAULT_FLUSH_MIN_DELAY = 5_000;
/** 最大延迟时间，延迟时间是用来防止频繁的网络请求 */
export const DEFAULT_FLUSH_MAX_DELAY = 5_500;

/** 回放的最小持续时长，用户播放的会话时间较短，rrweb 将不会发送回放数据 */
export const MIN_REPLAY_DURATION = 4_999;
/**
 * 回放最短时长的最大限制，防止了回放时长过短的情况，
 * 即使开发者修改了 minReplayDuration 的配置，也不能设置超过 15 秒的回放最小时长
 */
export const MIN_REPLAY_DURATION_LIMIT = 15_000;

/** 回放的最大持续时长 */
export const MAX_REPLAY_DURATION = 3_600_000; // 60 minutes in ms;

/* 错误检查 */
export const BUFFER_CHECKOUT_TIME = 60_000;

/**
 * 会话空闲后暂停录制的时间,用户空闲 5 分钟后，会暂停录制回放数据
 * 减少不必要的数据采集，提高性能，并节省存储资源
 * 用户在暂停后重新进行交互（如点击、滚动等），可能会恢复录制
 */
export const SESSION_IDLE_PAUSE_DURATION = 300_000; // 5 minutes in ms

/**
 * 会话空闲后会话终止的时间
 * 用户在 15 分钟内都没有任何交互，会话就会被视为过期（终止）
 */
export const SESSION_IDLE_EXPIRE_DURATION = 900_000; // 15 minutes in ms

/* 慢点击的最小时间阈值 */
export const SLOW_CLICK_THRESHOLD = 3_000;

/**
 * 在点击发生后，监控 300 毫秒内是否发生滚动，以判断滚动是否是由程序触发的。
 *
 * - 防止误判用户滚动：某些网站在点击某个按钮或元素后，可能会立即触发页面滚动。
 * 这个阈值用于检测滚动是用户行为还是程序触发的。
 * - 判断是否有异常滚动：如果用户点击某个按钮，页面在 300ms 内发生了滚动，
 * 可能说明有脚本在操作滚动位置，这可能是可疑行为。
 */
export const SLOW_CLICK_SCROLL_TIMEOUT = 300;

export const REPLAY_SESSION_KEY = "replaySession";

/** 当录制的数据超过这个大小时,停止 */
export const REPLAY_MAX_EVENT_BUFFER_SIZE = 20_000_000; // ~20MB

/** 重试间隔 */
export const RETRY_BASE_INTERVAL = 5000;
/** 重试次数 */
export const RETRY_MAX_COUNT = 3;

export const UNABLE_TO_SEND_REPLAY = "无法发送回放";

export const REPLAY_EVENT_NAME = "replay_event";
