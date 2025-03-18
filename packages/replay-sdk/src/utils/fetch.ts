import {
  BaseFetchOptions,
  FetchRequest,
  Transport,
  TransportMakeRequestResponse,
} from "../types";

import { makePromiseBuffer, PromiseBuffer } from "./promisebuffer";

export interface BunFetchOptions extends BaseFetchOptions {
  headers?: { [key: string]: string };
}

/**
 * 使用 fetch 发送数据到服务器
 */
export function makeFetchTransport(options: BunFetchOptions): Transport {
  function makeRequest(
    request: FetchRequest
  ): Promise<TransportMakeRequestResponse> {
    const requestOptions: RequestInit = {
      body: request.body,
      method: "POST",
      headers: options.headers,
    };

    try {
      return fetch(options.url, requestOptions).then((response) => {
        return {
          statusCode: response.status,
          headers: {
            "retry-after": response.headers.get("Retry-After"),
          },
        };
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return createTransport(options, makeRequest);
}

export const DEFAULT_TRANSPORT_BUFFER_SIZE = 64;

export function createTransport(
  options: InternalBaseTransportOptions,
  makeRequest: TransportRequestExecutor,
  buffer: PromiseBuffer<TransportMakeRequestResponse> = makePromiseBuffer(
    options.bufferSize || DEFAULT_TRANSPORT_BUFFER_SIZE
  )
): Transport {
  const flush = (timeout?: number): Promise<boolean> => buffer.drain(timeout);

  function send(envelope: Envelope): Promise<TransportMakeRequestResponse> {
    const requestTask = (): Promise<TransportMakeRequestResponse> =>
      makeRequest({ body: serializeRecordingData(envelope) }).then(
        (response) => {
          if (
            response.statusCode !== undefined &&
            (response.statusCode < 200 || response.statusCode >= 300)
          ) {
            console.warn(`响应 ${response.statusCode} to sent event.`);
          }
          return response;
        },
        (error) => {
          throw error;
        }
      );

    return buffer.add(requestTask).then(
      (result) => result,
      (error) => {
        throw error;
      }
    );
  }

  return {
    send,
    flush,
  };
}

/**
 * 序列化录制数据
 */
export function serializeRecordingData(
  envelope: Envelope
): string | Uint8Array {
  // 优先转为字符串，在遇到二进制数据转为二进制
  let parts: string | Uint8Array[] = "";

  function append(next: string | Uint8Array): void {
    if (typeof parts === "string") {
      parts =
        typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
    } else {
      parts.push(typeof next === "string" ? encodeUTF8(next) : next);
    }
  }

  if (typeof envelope === "string" || envelope instanceof Uint8Array) {
    append(envelope);
  } else {
    let stringifiedPayload: string;
    try {
      stringifiedPayload = JSON.stringify(envelope);
    } catch (e) {
      // 如果 JSON.stringify() 失败（可能是循环引用问题），使用 normalize(payload) 进行深度序列化。
      // stringifiedPayload = JSON.stringify(normalize(payload));
      stringifiedPayload = "error";
    }
    append(stringifiedPayload);
  }

  return typeof parts === "string" ? parts : concatBuffers(parts);
}

function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);

  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }

  return merged;
}

/**
 * 字符串转二进制
 */
function encodeUTF8(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

/**
 * 二进制转字符
 */
function decodeUTF8(input: Uint8Array): string {
  return new TextDecoder().decode(input);
}
