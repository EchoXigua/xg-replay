import type { Session } from "../types";
import { isSessionExpired } from "../utils";

/** 是否刷新会话 */
export function shouldRefreshSession(
  session: Session,
  {
    sessionIdleExpire,
    maxReplayDuration,
  }: { sessionIdleExpire: number; maxReplayDuration: number }
): boolean {
  // 会话没有过期，不需要刷新
  if (!isSessionExpired(session, { sessionIdleExpire, maxReplayDuration })) {
    return false;
  }

  // 会话处于“缓冲模式”，意味着会话数据尚未上传
  // 当前会话的第一个录制片段还没有被上传
  // 即使会话过期，也 不会刷新，仍然在收集数据
  if (session.sampled === "buffer" && session.segmentId === 0) {
    return false;
  }

  return true;
}
