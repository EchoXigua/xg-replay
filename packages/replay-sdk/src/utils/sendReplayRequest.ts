import type { ReplayEvent, TransportMakeRequestResponse } from "@sentry/types";
import type { RateLimits } from "@sentry/utils";

import { REPLAY_EVENT_NAME, UNABLE_TO_SEND_REPLAY } from "../constants";
import type { ReplayRecordingData, SendReplayData } from "../types";

/**
 * Send replay attachment using `fetch()`
 */
export async function sendReplayRequest({
  recordingData,
  replayId,
  segmentId: segment_id,
  eventContext,
  timestamp,
  session,
}: SendReplayData): Promise<TransportMakeRequestResponse> {
  const preparedRecordingData = prepareRecordingData({
    recordingData,
    headers: {
      segment_id,
    },
  });

  const { urls, errorIds, traceIds, initialTimestamp } = eventContext;

  if (!session.sampled) {
    return Promise.resolve({});
  }

  const baseEvent: ReplayEvent = {
    type: REPLAY_EVENT_NAME,
    replay_start_timestamp: initialTimestamp / 1000,
    timestamp: timestamp / 1000,
    error_ids: errorIds,
    trace_ids: traceIds,
    urls,
    replay_id: replayId,
    segment_id,
    replay_type: session.sampled,
  };

  /*
  For reference, the fully built event looks something like this:
  {
      "type": "replay_event",
      "timestamp": 1670837008.634,
      "error_ids": [
          "errorId"
      ],
      "trace_ids": [
          "traceId"
      ],
      "urls": [
          "https://example.com"
      ],
      "replay_id": "eventId",
      "segment_id": 3,
      "replay_type": "error",
      "platform": "javascript",
      "event_id": "eventId",
      "environment": "production",
      "sdk": {
          "integrations": [
              "BrowserTracing",
              "Replay"
          ],
          "name": "sentry.javascript.browser",
          "version": "7.25.0"
      },
      "sdkProcessingMetadata": {},
      "contexts": {
      },
  }
  */

  console.log("preparedRecordingData", baseEvent, preparedRecordingData);

  let response: TransportMakeRequestResponse;

  try {
    // response = await transport.send(envelope);
  } catch (err) {
    const error = new Error(UNABLE_TO_SEND_REPLAY);

    try {
      // In case browsers don't allow this property to be writable
      // @ts-expect-error This needs lib es2022 and newer
      error.cause = err;
    } catch {
      // nothing to do
    }
    throw error;
  }

  // 如果状态码无效，立即停止且不重试
  if (
    typeof response.statusCode === "number" &&
    (response.statusCode < 200 || response.statusCode >= 300)
  ) {
    throw new HttpStatusCodeError(response.statusCode);
  }

  return response;
}

export class HttpStatusCodeError extends Error {
  public constructor(statusCode: number) {
    super(`请求返回的状态码 ${statusCode}`);
  }
}

/**
 * This error indicates that we hit a rate limit API error.
 */
export class RateLimitError extends Error {
  public rateLimits: RateLimits;

  public constructor(rateLimits: RateLimits) {
    super("Rate limit hit");
    this.rateLimits = rateLimits;
  }
}

/** 处理录制数据 */
export function prepareRecordingData({
  recordingData,
  headers,
}: {
  recordingData: ReplayRecordingData;
  headers: Record<string, unknown>;
}): ReplayRecordingData {
  let payloadWithSequence;

  const replayHeaders = `${JSON.stringify(headers)}
`;

  // 判断录制的数据是 string 还是 二进制
  if (typeof recordingData === "string") {
    payloadWithSequence = `${replayHeaders}${recordingData}`;
  } else {
    // 将 string 转换成 Uint8Array （二进制）
    const enc = new TextEncoder();
    const sequence = enc.encode(replayHeaders);
    payloadWithSequence = new Uint8Array(
      sequence.length + recordingData.length
    );
    payloadWithSequence.set(sequence);
    payloadWithSequence.set(recordingData, sequence.length);
  }

  return payloadWithSequence;
}
