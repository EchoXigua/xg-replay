import type { ReplayRecordingData } from "../types";

import type {
  AddEventResult,
  EventBuffer,
  EventBufferType,
  RecordingEvent,
} from "../types";
import { EventBufferArray } from "./EventBufferArray";
import { EventBufferCompressionWorker } from "./EventBufferCompressionWorker";

/**
 * 主要用于代理事件缓冲区，优先使用压缩 worker 如果加载失败则降级到简单缓冲区
 */
export class EventBufferProxy implements EventBuffer {
  /** 回退方案 */
  private _fallback: EventBufferArray;
  /** 压缩 worker */
  private _compression: EventBufferCompressionWorker;
  /** 当前使用缓冲区 */
  private _used: EventBuffer;
  /** 确保 Worker 正确加载 */
  private _ensureWorkerIsLoadedPromise: Promise<void>;

  public constructor(worker: Worker) {
    this._fallback = new EventBufferArray();
    this._compression = new EventBufferCompressionWorker(worker);

    // 默认清空下加载简单缓冲区，如果异步加载压缩 worker 成功 则切换
    this._used = this._fallback;

    this._ensureWorkerIsLoadedPromise = this._ensureWorkerIsLoaded();
  }

  public get type(): EventBufferType {
    return this._used.type;
  }

  public get hasEvents(): boolean {
    return this._used.hasEvents;
  }

  public get hasCheckout(): boolean {
    return this._used.hasCheckout;
  }
  public set hasCheckout(value: boolean) {
    this._used.hasCheckout = value;
  }

  /** 摧毁所有的缓冲区，释放资源 */
  public destroy(): void {
    this._fallback.destroy();
    this._compression.destroy();
  }

  /** 清空当前使用的缓冲区 */
  public clear(): void {
    return this._used.clear();
  }

  /** 获取事件最早的时间戳 */
  public getEarliestTimestamp(): number | null {
    return this._used.getEarliestTimestamp();
  }

  /**
   * 将事件添加到缓冲区
   */
  public addEvent(event: RecordingEvent): Promise<AddEventResult> {
    return this._used.addEvent(event);
  }

  public async finish(): Promise<ReplayRecordingData> {
    // Ensure the worker is loaded, so the sent event is compressed
    await this.ensureWorkerIsLoaded();

    return this._used.finish();
  }

  /** 确保 worker 已经加载 */
  public ensureWorkerIsLoaded(): Promise<void> {
    return this._ensureWorkerIsLoadedPromise;
  }

  /** 这里是实际检查worker 是否加载完成 */
  private async _ensureWorkerIsLoaded(): Promise<void> {
    try {
      await this._compression.ensureReady();
    } catch (error) {
      console.error("加载压缩工作线程失败，回退到简单缓冲区");
      return;
    }

    // 加载成功后切换到压缩worker
    await this._switchToCompressionWorker();
  }

  /** Switch the used buffer to the compression worker. */
  private async _switchToCompressionWorker(): Promise<void> {
    const { events, hasCheckout } = this._fallback;

    const addEventPromises: Promise<void>[] = [];
    // 将事件重新添加到 新的缓冲区（压缩)
    for (const event of events) {
      addEventPromises.push(this._compression.addEvent(event));
    }

    this._compression.hasCheckout = hasCheckout;

    // 立即切换使用的缓冲区 到压缩 worker
    this._used = this._compression;

    // 等待所有旧事件成功转移，如果有错误
    try {
      await Promise.all(addEventPromises);
    } catch (error) {
      console.error("切换缓冲区时添加事件失败");
    }
  }
}
