import { useState } from 'react';
import { requestApi } from '@/services/api/client';

const DEFAULT_ERROR_MESSAGE = 'Erro ao calcular pilar';

export function useLocalSecondOrderColumn() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<unknown | null>(null);

  const resetCalculation = () => {
    setLoading(false);
    setErrorMessage(null);
    setResponseData(null);
  };

  const runCalculation = async (endpoint: string, payload: unknown) => {
    setErrorMessage(null);
    setResponseData(null);
    setLoading(true);

    try {
      const response = await requestApi(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        const parsedBody = response.data;
        const apiError =
          typeof parsedBody === 'object' &&
          parsedBody !== null &&
          'upstreamBody' in parsedBody &&
          typeof parsedBody.upstreamBody === 'object' &&
          parsedBody.upstreamBody !== null &&
          'message' in parsedBody.upstreamBody
            ? String(parsedBody.upstreamBody.message)
            : DEFAULT_ERROR_MESSAGE;

        setErrorMessage(apiError);
        setResponseData(parsedBody);
        return;
      }

      setResponseData(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro de comunicacao com a API.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    errorMessage,
    responseData,
    runCalculation,
    resetCalculation,
    setErrorMessage,
  };
}
