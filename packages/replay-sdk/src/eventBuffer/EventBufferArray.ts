import { REPLAY_MAX_EVENT_BUFFER_SIZE } from "../constants";
import type {
  AddEventResult,
  EventBuffer,
  EventBufferType,
  RecordingEvent,
} from "../types";
import { timestampToMs } from "../utils";
import { EventBufferSizeExceededError } from "./error";

/**
 * 用一个普通的数组来存储事件数据,作为使用压缩 worker失败的降级方案
 */
export class EventBufferArray implements EventBuffer {
  /** 存储所有的录制事件  */
  public events: RecordingEvent[];

  /** 是否快照 */
  public hasCheckout: boolean;

  private _totalSize: number;

  public constructor() {
    this.events = [];
    this._totalSize = 0;
    this.hasCheckout = false;
  }

  /** 是否录制了事件 */
  public get hasEvents(): boolean {
    return this.events.length > 0;
  }

  /** 该缓冲区是同步模式 */
  public get type(): EventBufferType {
    return "sync";
  }

  /** 销毁缓冲区*/
  public destroy(): void {
    this.events = [];
  }

  /** 添加事件到缓冲区 */
  public async addEvent(event: RecordingEvent): Promise<AddEventResult> {
    const eventSize = JSON.stringify(event).length;
    this._totalSize += eventSize;
    if (this._totalSize > REPLAY_MAX_EVENT_BUFFER_SIZE) {
      throw new EventBufferSizeExceededError();
    }

    this.events.push(event);
  }

  /** 数据上传 */
  public finish(): Promise<string> {
    return new Promise<string>((resolve) => {
      // 浅拷贝一份缓冲区数据，然后清空，这样做是为了避免在后续操作中丢失新的事件
      const eventsRet = this.events;
      this.clear();
      resolve(JSON.stringify(eventsRet));
    });
  }

  /** 清空缓冲区 */
  public clear(): void {
    this.events = [];
    this._totalSize = 0;
    this.hasCheckout = false;
  }

  /** 获取事件最早的时间戳 */
  public getEarliestTimestamp(): number | null {
    const timestamp = this.events.map((event) => event.timestamp).sort()[0];

    if (!timestamp) {
      return null;
    }

    return timestampToMs(timestamp);
  }
}
