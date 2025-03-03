import { REPLAY_MAX_EVENT_BUFFER_SIZE } from "../constants";

/** This error indicates that the event buffer size exceeded the limit.. */
export class EventBufferSizeExceededError extends Error {
  public constructor() {
    super(`时间缓冲区超过最大限制 ${REPLAY_MAX_EVENT_BUFFER_SIZE}.`);
  }
}
