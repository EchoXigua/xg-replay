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
