import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGeometryCalculation } from '@/hooks/features/use-geometry-calculation';
import { requestApi } from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  requestApi: vi.fn(),
}));

describe('useGeometryCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores mapped rows on successful response with result rows', async () => {
    const rows = [{ title: 'A', value: '560', unit: 'cm²' }];

    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      status: 200,
      data: { area: 560 },
      rawText: '{"area":560}',
      headers: new Headers(),
    });

    const { result } = renderHook(() =>
      useGeometryCalculation({
        buildResultRows: () => rows,
      }),
    );

    await act(async () => {
      await result.current.submitGeometry('/geometry/rectangular-section', { b: 14, h: 40 });
    });

    expect(result.current.isSending).toBe(false);
    expect(result.current.requestError).toBe('');
    expect(result.current.apiResponseData).toEqual({ area: 560 });
    expect(result.current.resultRows).toEqual(rows);
    expect(result.current.responseText).toBe('');
  });

  it('stores plain response text when no rows are produced', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      status: 200,
      data: 'resposta em texto',
      rawText: 'resposta em texto',
      headers: new Headers(),
    });

    const { result } = renderHook(() =>
      useGeometryCalculation({
        buildResultRows: () => [],
      }),
    );

    await act(async () => {
      await result.current.submitGeometry('/geometry/circle-section', { r: 10, points: 360 });
    });

    expect(result.current.resultRows).toEqual([]);
    expect(result.current.apiResponseData).toBe('resposta em texto');
    expect(result.current.responseText).toBe('resposta em texto');
    expect(result.current.requestError).toBe('');
  });

  it('sets friendly success text when API returns empty body', async () => {
    vi.mocked(requestApi).mockResolvedValue({
      ok: true,
      status: 200,
      data: null,
      rawText: '',
      headers: new Headers(),
    });

    const { result } = renderHook(() =>
      useGeometryCalculation({
        buildResultRows: () => [],
      }),
    );

    await act(async () => {
      await result.current.submitGeometry('/geometry/i-section', { bf: 60, h: 80 });
    });

    expect(result.current.apiResponseData).toBe('Requisicao enviada com sucesso (sem corpo na resposta).');
    expect(result.current.responseText).toBe('Requisicao enviada com sucesso (sem corpo na resposta).');
    expect(result.current.requestError).toBe('');
  });

  it('maps HTTP and network errors to requestError', async () => {
    vi.mocked(requestApi)
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        data: 'payload invalido',
        rawText: 'payload invalido',
        headers: new Headers(),
      })
      .mockRejectedValueOnce(new Error('socket hang up'));

    const { result } = renderHook(() =>
      useGeometryCalculation({
        buildResultRows: () => [],
      }),
    );

    await act(async () => {
      await result.current.submitGeometry('/geometry/t-section', { bf: 60, h: 80 });
    });

    expect(result.current.requestError).toBe('Erro 422: payload invalido');
    expect(result.current.apiResponseData).toBe('payload invalido');

    await act(async () => {
      await result.current.submitGeometry('/geometry/t-section', { bf: 60, h: 80 });
    });

    expect(result.current.requestError).toContain('Nao foi possivel conectar em /geometry/t-section.');
    expect(result.current.requestError).toContain('socket hang up');
  });
});
