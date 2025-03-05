import {
  RETRY_BASE_INTERVAL,
  RETRY_MAX_COUNT,
  UNABLE_TO_SEND_REPLAY,
} from "../constants";
import type { SendReplayData } from "../types";
import { HttpStatusCodeError, sendReplayRequest } from "./sendReplayRequest";

/**
 * 发送回访数据到服务器，默认会重试3次
 */
export async function sendReplay(
  replayData: SendReplayData,
  retryConfig = {
    count: 0,
    interval: RETRY_BASE_INTERVAL,
  }
): Promise<unknown> {
  const { recordingData, options } = replayData;

  if (!recordingData.length) {
    return;
  }

  try {
    await sendReplayRequest(replayData);
    return true;
  } catch (err) {
    if (err instanceof HttpStatusCodeError) {
      throw err;
    }

    if (retryConfig.count >= RETRY_MAX_COUNT) {
      const error = new Error(
        `${UNABLE_TO_SEND_REPLAY} - max retries exceeded`
      );

      try {
        // In case browsers don't allow this property to be writable
        // 这需要 es2022 以及更新
        error.cause = err;
      } catch {}

      throw error;
    }

    // 重试间隔 of 5, 10, 30
    retryConfig.interval *= ++retryConfig.count;

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await sendReplay(replayData, retryConfig);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      }, retryConfig.interval);
    });
  }
}
