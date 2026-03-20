import { ApiClientError, type ApiRequestOptions, type ApiResponse } from '@/types/api';

const DEFAULT_TIMEOUT_MS = 15000;

const tryParseBody = (rawText: string): unknown => {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
};

export async function requestApi<TData = unknown>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<TData>> {
  const { method = 'GET', headers, body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    const parsedBody = tryParseBody(rawText) as TData | null;

    return {
      ok: response.ok,
      status: response.status,
      data: parsedBody,
      rawText,
      headers: response.headers,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestApiOrThrow<TData = unknown>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<TData>> {
  const response = await requestApi<TData>(url, options);

  if (!response.ok) {
    throw new ApiClientError(
      `Request failed with status ${response.status}`,
      response.status,
      response.data,
      response.rawText,
    );
  }

  return response;
}
