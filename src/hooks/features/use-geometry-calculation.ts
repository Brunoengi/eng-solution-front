import { useState } from 'react';
import { requestApi } from '@/services/api/client';

interface UseGeometryCalculationOptions<TRow> {
  buildResultRows: (value: unknown) => TRow[];
}

export function useGeometryCalculation<TRow>({ buildResultRows }: UseGeometryCalculationOptions<TRow>) {
  const [isSending, setIsSending] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [apiResponseData, setApiResponseData] = useState<unknown | null>(null);
  const [resultRows, setResultRows] = useState<TRow[]>([]);
  const [requestError, setRequestError] = useState('');

  const reset = () => {
    setResponseText('');
    setApiResponseData(null);
    setResultRows([]);
    setRequestError('');
  };

  const submitGeometry = async (endpointUrl: string, payload: Record<string, number>) => {
    setIsSending(true);
    reset();

    try {
      const response = await requestApi(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        setApiResponseData(response.data ?? (response.rawText || null));
        setRequestError(`Erro ${response.status}: ${response.rawText || 'Falha ao processar requisicao.'}`);
        return;
      }

      if (!response.rawText) {
        const successMessage = 'Requisicao enviada com sucesso (sem corpo na resposta).';
        setResponseText(successMessage);
        setApiResponseData(successMessage);
        return;
      }

      const rows = buildResultRows(response.data);
      setApiResponseData(response.data);

      if (rows.length > 0) {
        setResultRows(rows);
        return;
      }

      setResponseText(typeof response.data === 'string' ? response.data : response.rawText);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setRequestError(`Nao foi possivel conectar em ${endpointUrl}. ${message}`.trim());
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    responseText,
    apiResponseData,
    resultRows,
    requestError,
    submitGeometry,
    reset,
    setRequestError,
  };
}
