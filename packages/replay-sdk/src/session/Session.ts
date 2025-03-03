import { uuid4 } from "../utils";
import type { Sampled, Session } from "../types";

/**
 * 返回一个完整的 Session 对象
 */
export function makeSession(
  session: Partial<Session> & { sampled: Sampled }
): Session {
  const now = Date.now();
  const id = session.id || uuid4();
  const started = session.started || now;
  const lastActivity = session.lastActivity || now;
  const segmentId = session.segmentId || 0;
  const sampled = session.sampled; // 是否被采样
  const previousSessionId = session.previousSessionId; // 关联上一个 Session

  return {
    id,
    started,
    lastActivity,
    segmentId,
    sampled,
    previousSessionId,
  };
}
