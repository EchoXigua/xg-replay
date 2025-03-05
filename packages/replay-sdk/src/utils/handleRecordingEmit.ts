import { EventType } from "@sentry-internal/rrweb";

import { updateClickDetectorForRecordingEvent } from "../coreHandlers/handleClick";
import { saveSession } from "../session";
import type {
  RecordingEvent,
  ReplayContainer,
  ReplayOptionFrameEvent,
} from "../types";
import { addEventSync } from "./addEvent";

type RecordingEmitCallback = (
  event: RecordingEvent,
  isCheckout?: boolean
) => void;

/**
 * 处理录制数据
 *
 * 将数据添加到缓冲区，达到条件后，发送到服务器
 */
export function getHandleRecordingEmit(
  replay: ReplayContainer
): RecordingEmitCallback {
  // 标记是否处理第一个事件
  let hadFirstEvent = false;

  return (event: RecordingEvent, _isCheckout?: boolean) => {
    if (!replay.checkAndHandleExpiredSession()) {
      console.warn("会话过期");
      return;
    }

    // 检查是否快照，如果是第一个事件，会认为需要快照
    const isCheckout = _isCheckout || !hadFirstEvent;
    hadFirstEvent = true; // 确保后续事件不会误判为快照

    // 监测用户点击行为
    // if (replay.clickDetector) {
    //   updateClickDetectorForRecordingEvent(replay.clickDetector, event);
    // }

    // 批量上传录制数据
    replay.addUpdate(() => {
      // buffer 模式下，如果需要快照，会清除旧的录制数据
      if (replay.recordingMode === "buffer" && isCheckout) {
        replay.setInitialState();
      }

      // 如果事件未被添加（可能是因为暂停、禁用或超出了最大回放时长）
      if (!addEventSync(replay, event, isCheckout)) {
        // 跳过 flush 逻辑，直接返回 true，表示不触发 debounced flush。
        return true;
      }

      // See https://github.com/rrweb-io/rrweb/blob/d8f9290ca496712aa1e7d472549480c4e7876594/packages/rrweb/src/types.ts#L16
      // 不是快照，不触发 flush
      if (!isCheckout) {
        return false;
      }

      addSettingsEvent(replay, isCheckout);

      // 如果 session 由旧 session 继承，不立即 flush：等待用户有实际交互后再上传。
      if (replay.session && replay.session.previousSessionId) {
        return true;
      }

      // buffer 模式下 更新 session 的开始事件
      if (
        replay.recordingMode === "buffer" &&
        replay.session &&
        replay.eventBuffer
      ) {
        const earliestEvent = replay.eventBuffer.getEarliestTimestamp();
        if (earliestEvent) {
          console.info(
            `更新会话的开始事件为缓冲区最早的事件，时间为： ${new Date(
              earliestEvent
            )}`
          );

          replay.session.started = earliestEvent;

          if (replay.getOptions().stickySession) {
            saveSession(replay.session);
          }
        }
      }

      // session 模式，实时记录并上传数据，立即调用 flush
      if (replay.recordingMode === "session") {
        // 如果完整快照是由于页面初始加载触发的，那么不会有（previous session ID）
        // 在这种情况下，需要将事件缓冲一段时间后再刷新（flush），以避免捕获那些立即关闭窗口的用户的行为。
        void replay.flush();
      }

      return true;
    });
  };
}

/**
 * Exported for tests
 */
export function createOptionsEvent(
  replay: ReplayContainer
): ReplayOptionFrameEvent {
  const options = replay.getOptions();
  return {
    type: EventType.Custom,
    timestamp: Date.now(),
    data: {
      tag: "options",
      payload: {
        shouldRecordCanvas: replay.isRecordingCanvas(),
        sessionSampleRate: options.sessionSampleRate,
        errorSampleRate: options.errorSampleRate,
        useCompressionOption: options.useCompression,
        blockAllMedia: options.blockAllMedia,
        maskAllText: options.maskAllText,
        maskAllInputs: options.maskAllInputs,
        useCompression: replay.eventBuffer
          ? replay.eventBuffer.type === "worker"
          : false,
        networkDetailHasUrls: options.networkDetailAllowUrls.length > 0,
        networkCaptureBodies: options.networkCaptureBodies,
        networkRequestHasHeaders: options.networkRequestHeaders.length > 0,
        networkResponseHasHeaders: options.networkResponseHeaders.length > 0,
      },
    },
  };
}

/**
 * Add a "meta" event that contains a simplified view on current configuration
 * options. This should only be included on the first segment of a recording.
 */
function addSettingsEvent(replay: ReplayContainer, isCheckout?: boolean): void {
  // Only need to add this event when sending the first segment
  if (!isCheckout || !replay.session || replay.session.segmentId !== 0) {
    return;
  }

  addEventSync(replay, createOptionsEvent(replay), false);
}
