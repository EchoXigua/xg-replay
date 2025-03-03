import { REPLAY_SESSION_KEY } from "../../src/constants";
import type { ReplayContainer } from "../../src/types";
import { hasSessionStorage } from ".";

/**
 * Removes the session from Session Storage and unsets session in replay instance
 */
export function clearSession(replay: ReplayContainer): void {
  deleteSession();
  replay.session = undefined;
}

/**
 * 从会话存储中清理 session
 */
function deleteSession(): void {
  if (!hasSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(REPLAY_SESSION_KEY);
  } catch {}
}
