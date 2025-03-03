import type { EventBuffer } from "../types";
import { EventBufferArray } from "./EventBufferArray";
import { EventBufferProxy } from "./EventBufferProxy";
import workerString from "./worker";

interface CreateEventBufferParams {
  useCompression: boolean;
  workerUrl?: string;
}

export function createEventBuffer({
  useCompression,
  workerUrl: customWorkerUrl,
}: CreateEventBufferParams): EventBuffer {
  // 使用压缩后的事件缓冲
  if (useCompression && window.Worker) {
    const worker = _loadWorker(customWorkerUrl);

    if (worker) {
      return worker;
    }
  }

  console.info("简单的事件缓冲数组");
  return new EventBufferArray();
}

function _loadWorker(customWorkerUrl?: string): EventBufferProxy | void {
  try {
    const workerUrl = customWorkerUrl || _getWorkerUrl();

    if (!workerUrl) {
      return;
    }

    console.info(
      `使用压缩 worker${customWorkerUrl ? ` from ${customWorkerUrl}` : ""}`
    );
    const worker = new Worker(workerUrl);
    return new EventBufferProxy(worker);
  } catch (error) {
    console.error(new Error("创建压缩 worker 失败"));
  }
}

function _getWorkerUrl(): string {
  if (
    typeof __SENTRY_EXCLUDE_REPLAY_WORKER__ === "undefined" ||
    !__SENTRY_EXCLUDE_REPLAY_WORKER__
  ) {
    return getWorkerURL();
  }

  return "";
}

export function getWorkerURL(): string {
  const workerBlob = new Blob([workerString]);
  return URL.createObjectURL(workerBlob);
}
