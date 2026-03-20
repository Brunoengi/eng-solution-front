import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLocalSecondOrderColumn } from '@/hooks/features/use-local-second-order-column';
import { requestApi } from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  requestApi: vi.fn(),
}));

describe('useLocalSecondOrderColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores response data on success', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      status: 200,
      data: { results: { value: 10 } },
      rawText: '{"results":{"value":10}}',
      headers: new Headers(),
    });

    const { result } = renderHook(() => useLocalSecondOrderColumn());

    await act(async () => {
      await result.current.runCalculation('/api/test', { a: 1 });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.responseData).toEqual({ results: { value: 10 } });
  });

  it('maps upstream error message when request fails', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: false,
      status: 400,
      data: {
        upstreamBody: {
          message: 'Payload invalido',
        },
      },
      rawText: '{"upstreamBody":{"message":"Payload invalido"}}',
      headers: new Headers(),
    });

    const { result } = renderHook(() => useLocalSecondOrderColumn());

    await act(async () => {
      await result.current.runCalculation('/api/test', { a: 1 });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.errorMessage).toBe('Payload invalido');
    expect(result.current.responseData).toEqual({
      upstreamBody: {
        message: 'Payload invalido',
      },
    });
  });
});
