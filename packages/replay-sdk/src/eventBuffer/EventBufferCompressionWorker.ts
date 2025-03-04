import type { ReplayRecordingData } from "../types";

import { REPLAY_MAX_EVENT_BUFFER_SIZE } from "../constants";
import type {
  AddEventResult,
  EventBuffer,
  EventBufferType,
  RecordingEvent,
} from "../types";
import { timestampToMs } from "../utils";
import { WorkerHandler } from "./WorkerHandler";
import { EventBufferSizeExceededError } from "./error";

/**
 * 实现了一个事件缓冲区,利用 Web Worker 对事件进行压缩处理
 * 通过 Web Worker 异步地压缩存储事件数据，确保事件数据不会直接在主线程中积累过多负载
 */
export class EventBufferCompressionWorker implements EventBuffer {
  /** 是否快照 */
  public hasCheckout: boolean;

  /** worker 实例 */
  private _worker: WorkerHandler;
  /** 当前缓冲区中最早的事件时间戳 */
  private _earliestTimestamp: number | null;
  /** 缓冲区中所有事件的总大小（字节数） */
  private _totalSize;

  public constructor(worker: Worker) {
    this._worker = new WorkerHandler(worker);
    this._earliestTimestamp = null;
    this._totalSize = 0;
    this.hasCheckout = false;
  }

  public get hasEvents(): boolean {
    return !!this._earliestTimestamp;
  }

  public get type(): EventBufferType {
    return "worker";
  }

  /**
   * 确保 Web Worker 已准备好接收事件数据
   */
  public ensureReady(): Promise<void> {
    return this._worker.ensureReady();
  }

  /**
   * 销毁事件缓冲区,清理worker
   */
  public destroy(): void {
    this._worker.destroy();
  }

  /**
   * 将一个事件添加到缓冲区，并通过 Worker 进行压缩。
   */
  public addEvent(event: RecordingEvent): Promise<AddEventResult> {
    const timestamp = timestampToMs(event.timestamp);

    // 事件的时间戳早于现有的最早时间戳，则更新
    if (!this._earliestTimestamp || timestamp < this._earliestTimestamp) {
      this._earliestTimestamp = timestamp;
    }

    const data = JSON.stringify(event);
    // 更新缓冲区总大小
    this._totalSize += data.length;

    // 如果超出大小限制,抛出异常
    if (this._totalSize > REPLAY_MAX_EVENT_BUFFER_SIZE) {
      return Promise.reject(new EventBufferSizeExceededError());
    }

    // 将事件数据发送到 Worker 进行处理
    return this._sendEventToWorker(data);
  }

  public finish(): Promise<ReplayRecordingData> {
    return this._finishRequest();
  }

  /** 清空事件缓冲区，并重置状态。 */
  public clear(): void {
    this._earliestTimestamp = null;
    this._totalSize = 0;
    this.hasCheckout = false;

    // 向worker发送 clear 消息,不等待清空操作的结果
    this._worker.postMessage("clear").then(null, (e) => {
      console.error("向worker发送“clear”消息失败");
    });
  }

  public getEarliestTimestamp(): number | null {
    return this._earliestTimestamp;
  }

  /**
   * 向 Worker 发送事件数据
   */
  private _sendEventToWorker(data: string): Promise<AddEventResult> {
    return this._worker.postMessage<void>("addEvent", data);
  }

  /**
   * 请求 Worker 完成压缩，并返回压缩后的数据
   */
  private async _finishRequest(): Promise<Uint8Array> {
    const response = await this._worker.postMessage<Uint8Array>("finish");

    this._earliestTimestamp = null;
    this._totalSize = 0;

    return response;
  }
}
