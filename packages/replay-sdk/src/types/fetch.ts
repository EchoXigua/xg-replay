export interface BaseFetchOptions {
  url: string;
  bufferSize: number;
}

export interface FetchRequest {
  body: string | Uint8Array;
}

export interface Transport {
  send(request: Envelope): Promise<TransportMakeRequestResponse>;
  flush(timeout?: number): Promise<boolean>;
}

export type TransportMakeRequestResponse = {
  statusCode?: number;
  headers?: {
    [key: string]: string | null;
    "retry-after": string | null;
  };
};
