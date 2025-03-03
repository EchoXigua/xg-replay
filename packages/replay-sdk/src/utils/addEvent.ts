import { EventBufferSizeExceededError } from "../eventBuffer/error";
import type { AddEventResult, RecordingEvent, ReplayContainer } from "../types";
import { timestampToMs } from ".";

/**
 * 同步地将事件添加到事件缓冲区
 * 与 _addEvent() 的区别在于 不返回 Promise，并且不会等待事件添加的成功或失败。
 */
export function addEventSync(
  replay: ReplayContainer,
  event: RecordingEvent,
  isCheckout?: boolean
): boolean {
  if (!shouldAddEvent(replay, event)) {
    return false;
  }

  // This should never reject
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  _addEvent(replay, event, isCheckout);

  return true;
}

/**
 * 添加事件到缓冲区
 * 如果没有添加,返回null,添加成功则说明都不返回
 *
 * 如果这是第一个事件，或者是由 checkoutEveryNms 触发的事件，则为 true
 */
export function addEvent(
  replay: ReplayContainer,
  event: RecordingEvent,
  isCheckout?: boolean
): Promise<AddEventResult | null> {
  if (!shouldAddEvent(replay, event)) {
    return Promise.resolve(null);
  }

  return _addEvent(replay, event, isCheckout);
}

async function _addEvent(
  replay: ReplayContainer,
  event: RecordingEvent,
  isCheckout?: boolean
): Promise<AddEventResult | null> {
  if (!replay.eventBuffer) {
    return null;
  }

  try {
    // 清理缓冲区
    if (isCheckout && replay.recordingMode === "buffer") {
      replay.eventBuffer.clear();
    }

    if (isCheckout) {
      replay.eventBuffer.hasCheckout = true;
    }

    return await replay.eventBuffer.addEvent(event);
  } catch (error) {
    const reason =
      error && error instanceof EventBufferSizeExceededError
        ? "addEventSizeExceeded"
        : "addEvent";
    // replay.handleException(error);

    await replay.stop({ reason });
  }
}

/** 是否应该添加该事件 */
export function shouldAddEvent(
  replay: ReplayContainer,
  event: RecordingEvent
): boolean {
  if (!replay.eventBuffer || replay.isPaused() || !replay.isEnabled()) {
    return false;
  }

  const timestampInMs = timestampToMs(event.timestamp);

  // 事件是否超出 5 分钟的空闲时间
  if (timestampInMs + replay.timeouts.sessionIdlePause < Date.now()) {
    return false;
  }

  // 事件的时间戳是否超出最大录制时长（60分钟）
  if (
    timestampInMs >
    replay.getContext().initialTimestamp + replay.getOptions().maxReplayDuration
  ) {
    console.info(
      `Skipping event with timestamp ${timestampInMs} because it is after maxReplayDuration`
    );
    return false;
  }

  return true;
}
