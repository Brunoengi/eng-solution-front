export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  timeoutMs?: number;
}

export interface ApiResponse<TData = unknown> {
  ok: boolean;
  status: number;
  data: TData | null;
  rawText: string;
  headers: Headers;
}

export class ApiClientError extends Error {
  status: number;
  data: unknown;
  rawText: string;

  constructor(message: string, status: number, data: unknown, rawText: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    this.rawText = rawText;
  }
}
