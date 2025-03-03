import type { Session } from "../types";

/**
 * 检查当前时间是否过期
 */
export function isExpired(
  initialTime: null | number,
  expiry: undefined | number,
  targetTime: number = +new Date()
): boolean {
  if (initialTime === null || expiry === undefined || expiry < 0) {
    return true;
  }

  if (expiry === 0) {
    return false;
  }

  return initialTime + expiry <= targetTime;
}

/**
 * 检查会话是否过期
 */
export function isSessionExpired(
  session: Session,
  {
    maxReplayDuration, // 最大回放时长
    sessionIdleExpire, // 会话空闲超时时间
    targetTime = Date.now(),
  }: {
    maxReplayDuration: number;
    sessionIdleExpire: number;
    targetTime?: number;
  }
): boolean {
  return (
    // 会话是否过期
    isExpired(session.started, maxReplayDuration, targetTime) ||
    // 用户是否长时间没有活动，导致会话过期。
    isExpired(session.lastActivity, sessionIdleExpire, targetTime)
  );
}

export function isSampled(sampleRate?: number): boolean {
  if (sampleRate === undefined) {
    return false;
  }

  // Math.random() returns a number in range of 0 to 1 (inclusive of 0, but not 1)
  return Math.random() < sampleRate;
}

interface CryptoInternal {
  getRandomValues(array: Uint8Array): Uint8Array;
  randomUUID?(): string;
}

interface CryptoGlobal {
  msCrypto?: CryptoInternal;
  crypto?: CryptoInternal;
}
/**
 * UUID4 generator
 *
 * @returns string Generated UUID4.
 */
export function uuid4(): string {
  const gbl = window as typeof window & CryptoGlobal;
  const crypto = gbl.crypto || gbl.msCrypto;

  let getRandomByte = (): number => Math.random() * 16;
  try {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }
    if (crypto && crypto.getRandomValues) {
      getRandomByte = () => {
        // crypto.getRandomValues might return undefined instead of the typed array
        // in old Chromium versions (e.g. 23.0.1235.0 (151422))
        // However, `typedArray` is still filled in-place.
        // @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#typedarray
        const typedArray = new Uint8Array(1);
        crypto.getRandomValues(typedArray);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return typedArray[0]!;
      };
    }
  } catch (_) {
    // some runtimes can crash invoking crypto
    // https://github.com/getsentry/sentry-javascript/issues/8935
  }

  // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
  // Concatenating the following numbers as strings results in '10000000100040008000100000000000'
  return (([1e7] as unknown as string) + 1e3 + 4e3 + 8e3 + 1e11).replace(
    /[018]/g,
    (c) =>
      // eslint-disable-next-line no-bitwise
      (
        (c as unknown as number) ^
        ((getRandomByte() & 15) >> ((c as unknown as number) / 4))
      ).toString(16)
  );
}

/**
 * 秒转为毫秒
 */
export function timestampToMs(timestamp: number): number {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp : timestamp * 1000;
}

/**
 * 毫秒转为秒
 */
export function timestampToS(timestamp: number): number {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp / 1000 : timestamp;
}
