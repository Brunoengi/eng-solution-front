'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardPanelCard } from '@/components/user/molecules/dashboard-panel-card';

type ApiRequestResponseView = 'request' | 'response';

interface ApiRequestResponsePanelProps {
  endpoint: string;
  requestPayload: unknown;
  responseData: unknown | null;
  errorMessage?: string | null;
  headerAccessory?: ReactNode;
  className?: string;
  compactControlClassName?: string;
  helperClassName?: string;
  errorClassName?: string;
  requestLabel?: string;
  responseLabel?: string;
  emptyResponseText?: string;
  autoSwitchToResponseOnData?: boolean;
}

export function ApiRequestResponsePanel({
  endpoint,
  requestPayload,
  responseData,
  errorMessage,
  headerAccessory,
  className = '',
  compactControlClassName = 'text-xs',
  helperClassName = 'text-xs text-muted-foreground',
  errorClassName = 'text-xs font-medium text-red-600',
  requestLabel = 'Chamada para API',
  responseLabel = 'Resposta da API',
  emptyResponseText = 'Nenhuma resposta ainda.',
  autoSwitchToResponseOnData = true,
}: ApiRequestResponsePanelProps) {
  const [view, setView] = useState<ApiRequestResponseView>('request');

  const hasResponse = responseData !== null;

  useEffect(() => {
    if (view === 'response' && !hasResponse) {
      setView('request');
    }
  }, [hasResponse, view]);

  useEffect(() => {
    if (autoSwitchToResponseOnData && hasResponse) {
      setView('response');
    }
  }, [autoSwitchToResponseOnData, hasResponse]);

  return (
    <DashboardPanelCard
      className={`flex min-h-0 flex-col xl:flex-1 ${className}`}
      bodyClassName="flex min-h-0 flex-1 flex-col"
      headerLeft={(
        <div className="inline-flex w-fit rounded-md border border-border bg-muted/50 p-1">
          <Button
            type="button"
            variant={view === 'request' ? 'default' : 'ghost'}
            className={`h-7 px-3 ${compactControlClassName}`}
            onClick={() => setView('request')}
          >
            {requestLabel}
          </Button>
          <Button
            type="button"
            variant={view === 'response' ? 'default' : 'ghost'}
            className={`h-7 px-3 ${compactControlClassName}`}
            onClick={() => setView('response')}
            disabled={!hasResponse}
          >
            {responseLabel}
          </Button>
        </div>
      )}
      headerRight={headerAccessory}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <p className={`mt-3 ${helperClassName}`}>
          Endpoint atual: <span className="font-mono text-foreground">{endpoint}</span>
        </p>
        <pre className={`mt-4 min-h-0 flex-1 overflow-auto rounded-md border border-input bg-background p-3 ${helperClassName}`}>
          {view === 'request'
            ? JSON.stringify(requestPayload, null, 2)
            : (JSON.stringify(responseData, null, 2) || emptyResponseText)}
        </pre>
        {errorMessage && (
          <p className={`mt-3 ${errorClassName}`}>{errorMessage}</p>
        )}
      </div>
    </DashboardPanelCard>
  );
}