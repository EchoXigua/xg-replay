export interface PromiseBuffer<T> {
  $: Array<PromiseLike<T>>;
  add(taskProducer: () => Promise<T>): Promise<T>;
  drain(timeout?: number): Promise<boolean>;
}

/**
 * 管理和限制并发 promise 的数量
 * 确保不会一次性创建过多的异步任务，导致内存溢出或请求过载。
 * @param limit 控制缓冲区最多能存储多少个 Promise。
 */
export function makePromiseBuffer<T>(limit?: number): PromiseBuffer<T> {
  const buffer: Array<Promise<T>> = [];

  function isReady(): boolean {
    return limit === undefined || buffer.length < limit;
  }

  /**
   * 从缓冲区中移除事件
   * @returns 如果任务存在，返回任务本身
   */
  function remove(task: Promise<T>): Promise<T | void> {
    return (
      buffer.splice(buffer.indexOf(task), 1)[0] || Promise.resolve(undefined)
    );
  }

  /**
   * 添加一个 promise 任务到缓冲区，在完成时会自动删除
   */
  function add(taskProducer: () => Promise<T>): Promise<T> {
    if (!isReady()) {
      return Promise.reject(new Error("缓冲区达到限制，无法添加 promise 任务"));
    }

    // 启动任务，并添加早缓冲区中
    const task = taskProducer();
    if (buffer.indexOf(task) === -1) {
      buffer.push(task);
    }

    // 任务结束后，自动移除（任务成功失败，都会移除）
    void task
      .then(() => remove(task))
      .then(null, () => remove(task).then(null, () => {}));
    return task;
  }

  /**
   * 等待缓冲区中的所有 Promise 任务完成， 或者在 timeout 过期后，返回 false
   * @param timeout 超时时间
   */
  function drain(timeout?: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let counter = buffer.length;

      if (!counter) {
        return resolve(true);
      }

      // 设置超时机制
      const capturedSetTimeout = setTimeout(() => {
        if (timeout && timeout > 0) {
          resolve(false);
        }
      }, timeout);

      // 遍历 buffer 里的所有 Promise，等待它们完成
      // 如果所有 Promise 都 resolve，则清除超时定时器，返回 true
      buffer.forEach((item) => {
        void Promise.resolve(item).then(() => {
          if (!--counter) {
            clearTimeout(capturedSetTimeout);
            resolve(true);
          }
        }, reject);
      });
    });
  }

  return {
    $: buffer,
    add,
    drain,
  };
}
