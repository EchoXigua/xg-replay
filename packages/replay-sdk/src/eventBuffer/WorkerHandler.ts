import type { WorkerRequest, WorkerResponse } from "../types";

/**
 * 管理 worker 的类，和 worker 进行通信，被用来处理事件的压缩和存储
 */
export class WorkerHandler {
  private _worker: Worker;
  private _id: number;
  /** 确保只执行一次 Worker 就绪检查 */
  private _ensureReadyPromise?: Promise<void>;

  public constructor(worker: Worker) {
    this._worker = worker;
    this._id = 0;
  }

  /**
   * 确保 worker 已经准备好
   */
  public ensureReady(): Promise<void> {
    // 确保只检查一次
    if (this._ensureReadyPromise) {
      return this._ensureReadyPromise;
    }

    this._ensureReadyPromise = new Promise((resolve, reject) => {
      // 监听 message 事件，如果返回的 data.success 为 true，表示 Worker 可用
      this._worker.addEventListener(
        "message",
        ({ data }: MessageEvent) => {
          if ((data as WorkerResponse).success) {
            resolve();
          } else {
            reject();
          }
        },
        { once: true }
      );

      // 如果 Worker 发生 error，则调用 reject(error)
      this._worker.addEventListener(
        "error",
        (error) => {
          reject(error);
        },
        { once: true }
      );
    });

    return this._ensureReadyPromise;
  }

  public destroy(): void {
    console.info("摧毁压缩 worker");
    // 终止 Worker 进程
    this._worker.terminate();
  }

  /**
   * 发送消息到worker
   */
  public postMessage<T>(
    method: WorkerRequest["method"],
    arg?: WorkerRequest["arg"]
  ): Promise<T> {
    const id = this._getAndIncrementId();

    return new Promise((resolve, reject) => {
      const listener = ({ data }: MessageEvent): void => {
        // 检查是否是对应的请求
        // 一个事件可以注册多个监听器（回调）
        const response = data as WorkerResponse;
        if (response.method !== method) {
          return;
        }
        if (response.id !== id) {
          return;
        }

        this._worker.removeEventListener("message", listener);

        if (!response.success) {
          console.error("压缩 worker 发生了错误: ", response.response);
          reject(new Error("压缩 worker 发生了错误"));
          return;
        }

        resolve(response.response as T);
      };

      // 注意：这里不能使用 once 因为需要监听多个消息
      this._worker.addEventListener("message", listener);
      this._worker.postMessage({ id, method, arg });
    });
  }

  /** 返回当前 ID，并自增，确保每个请求都有唯一 ID。*/
  private _getAndIncrementId(): number {
    return this._id++;
  }
}
