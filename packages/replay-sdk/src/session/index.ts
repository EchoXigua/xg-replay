import { REPLAY_SESSION_KEY } from "../../src/constants";
import type { Session } from "../types";

export function hasSessionStorage(): boolean {
  try {
    return "sessionStorage" in window && !!window.sessionStorage;
  } catch {
    return false;
  }
}

export function saveSession(session: Session): void {
  if (!hasSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(REPLAY_SESSION_KEY, JSON.stringify(session));
  } catch {}
}
