import type { Session, SessionOptions, Sampled } from "../types";
import { shouldRefreshSession } from "./shouldRefreshSession";
import { isSampled } from "../utils";
import { makeSession } from "./Session";
import { hasSessionStorage, saveSession } from ".";
import { REPLAY_SESSION_KEY } from "../constants";

/**
 * 获取或创建会话
 */
export function loadOrCreateSession(
  {
    sessionIdleExpire,
    maxReplayDuration,
    previousSessionId,
  }: {
    sessionIdleExpire: number;
    maxReplayDuration: number;
    previousSessionId?: string;
  },
  sessionOptions: SessionOptions
): Session {
  // 如果启用会话持久化，尝试从本地加载会话
  const existingSession = sessionOptions.stickySession && fetchSession();

  if (!existingSession) {
    console.info("创建新的会话");
    return createSession(sessionOptions, { previousSessionId });
  }

  // 没有过期,直接返回
  if (
    !shouldRefreshSession(existingSession, {
      sessionIdleExpire,
      maxReplayDuration,
    })
  ) {
    return existingSession;
  }

  console.info("本地会话已经过期,创建一个新的...");
  return createSession(sessionOptions, {
    previousSessionId: existingSession.id,
  });
}

/**
 * Fetches a session from storage
 */
export function fetchSession(): Session | null {
  if (!hasSessionStorage()) {
    return null;
  }

  try {
    // 可能会因为浏览器禁用 cookie 而抛出异常
    const sessionStringFromStorage =
      window.sessionStorage.getItem(REPLAY_SESSION_KEY);

    if (!sessionStringFromStorage) {
      return null;
    }

    const sessionObj = JSON.parse(sessionStringFromStorage) as Session;

    console.info("加载已经存在的会话");
    return makeSession(sessionObj);
  } catch {
    return null;
  }
}

/**
 * 创建新的会话
 */
export function createSession(
  { sessionSampleRate, allowBuffering, stickySession = false }: SessionOptions,
  { previousSessionId }: { previousSessionId?: string } = {}
): Session {
  const sampled = getSessionSampleType(sessionSampleRate, allowBuffering);
  const session = makeSession({
    sampled,
    previousSessionId,
  });

  // 存入 sessionStorage
  if (stickySession) {
    saveSession(session);
  }

  return session;
}

/**
 * 根据采样率和缓冲模式确实 session 是否采样
 */
export function getSessionSampleType(
  sessionSampleRate: number,
  allowBuffering: boolean
): Sampled {
  return isSampled(sessionSampleRate)
    ? "session"
    : allowBuffering
    ? "buffer"
    : false;
}
