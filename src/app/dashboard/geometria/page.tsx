'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputNumber } from '@/components/user/atoms/input-number';
import { ApiRequestResponsePanel } from '@/components/user/molecules/api-request-response-panel';
import { DashboardPanelCard } from '@/components/user/molecules/dashboard-panel-card';
import { useGeometryCalculation } from '@/hooks/features/use-geometry-calculation';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../components/user/molecules/sidebar';
import { Section3DViewer } from '../../../components/user/molecules/section-3d-viewer';
import { Settings } from 'lucide-react';
import * as styles from '@/styles/fns-styles';

type GeometryOptionKey =
  | 'rectangular-section'
  | 'circle-section'
  | 'i-section'
  | 'i-rectangular-corbel-section'
  | 't-section'
  | 't-rectangular-corbel-section'
  | 'i-triangular-corbel-section'
  | 't-triangular-corbel-section';

interface GeometryField {
  key: string;
  label: string | ReactNode;
  defaultValue: number;
  unit?: string;
}

interface GeometryOption {
  key: GeometryOptionKey;
  label: string;
  endpoint: string;
  fields: GeometryField[];
}

interface ResultRow {
  title: string;
  value: string;
  unit: string;
}

const GEOMETRY_OPTIONS: GeometryOption[] = [
  {
    key: 'rectangular-section',
    label: 'Seção Retangular',
    endpoint: '/geometry/rectangular-section',
    fields: [
      { key: 'b', label: 'b', defaultValue: 14 },
      { key: 'h', label: 'h', defaultValue: 40 },
    ],
  },
  {
    key: 'circle-section',
    label: 'Seção Circular',
    endpoint: '/geometry/circle-section',
    fields: [
      { key: 'r', label: 'r', defaultValue: 10 },
      { key: 'points', label: 'points', defaultValue: 360 },
    ],
  },
  {
    key: 'i-section',
    label: 'Seção I',
    endpoint: '/geometry/i-section',
    fields: [
      { key: 'bf', label: 'Largura da mesa (bf)', defaultValue: 80 },
      { key: 'hf', label: 'Espessura da mesa (hf)', defaultValue: 12 },
      { key: 'bw', label: 'Largura da alma (bw)', defaultValue: 25 },
      { key: 'h', label: 'h', defaultValue: 80 },
      { key: 'bi', label: 'Largura inferior (bi)', defaultValue: 40 },
      { key: 'hi', label: 'Espessura inferior (hi)', defaultValue: 10 },
    ],
  },
  {
    key: 'i-rectangular-corbel-section',
    label: 'Seção I com mísulas retangulares',
    endpoint: '/geometry/i-rectangular-corbel-section',
    fields: [
      { key: 'bf', label: 'bf', defaultValue: 60 },
      { key: 'hf', label: 'hf', defaultValue: 12 },
      { key: 'bw', label: 'bw', defaultValue: 20 },
      { key: 'h', label: 'h', defaultValue: 80 },
      { key: 'bi', label: 'bi', defaultValue: 40 },
      { key: 'hi', label: 'hi', defaultValue: 10 },
      { key: 'bmissup', label: 'bmissup', defaultValue: 8 },
      { key: 'hmissup', label: 'hmissup', defaultValue: 6 },
      { key: 'bmisinf', label: 'bmisinf', defaultValue: 6 },
      { key: 'hmisinf', label: 'hmisinf', defaultValue: 4 },
    ],
  },
  {
    key: 't-section',
    label: 'Seção T',
    endpoint: '/geometry/t-section',
    fields: [
      { key: 'bf', label: 'bf', defaultValue: 60 },
      { key: 'hf', label: 'hf', defaultValue: 12 },
      { key: 'bw', label: 'bw', defaultValue: 20 },
      { key: 'h', label: 'h', defaultValue: 80 },
    ],
  },
  {
    key: 't-rectangular-corbel-section',
    label: 'Seção T com mísula retangular',
    endpoint: '/geometry/t-rectangular-corbel-section',
    fields: [
      { key: 'bf', label: 'bf', defaultValue: 60 },
      { key: 'hf', label: 'hf', defaultValue: 12 },
      { key: 'bw', label: 'bw', defaultValue: 20 },
      { key: 'h', label: 'h', defaultValue: 80 },
      { key: 'bmis', label: 'bmis', defaultValue: 6 },
      { key: 'hmis', label: 'hmis', defaultValue: 4 },
    ],
  },
  {
    key: 'i-triangular-corbel-section',
    label: 'Seção I com mísulas triangulares',
    endpoint: '/geometry/i-triangular-corbel-section',
    fields: [
      { key: 'bf', label: 'bf', defaultValue: 60 },
      { key: 'hf', label: 'hf', defaultValue: 12 },
      { key: 'bw', label: 'bw', defaultValue: 20 },
      { key: 'h', label: 'h', defaultValue: 80 },
      { key: 'bi', label: 'bi', defaultValue: 40 },
      { key: 'hi', label: 'hi', defaultValue: 10 },
      { key: 'bmissup', label: 'bmissup', defaultValue: 8 },
      { key: 'hmissup', label: 'hmissup', defaultValue: 6 },
      { key: 'bmisinf', label: 'bmisinf', defaultValue: 6 },
      { key: 'hmisinf', label: 'hmisinf', defaultValue: 4 },
    ],
  },
  {
    key: 't-triangular-corbel-section',
    label: 'Seção T com mísula triangular',
    endpoint: '/geometry/t-triangular-corbel-section',
    fields: [
      { key: 'bf', label: 'bf', defaultValue: 60 },
      { key: 'hf', label: 'hf', defaultValue: 12 },
      { key: 'bw', label: 'bw', defaultValue: 20 },
      { key: 'h', label: 'h', defaultValue: 80 },
      { key: 'bmis', label: 'bmis', defaultValue: 6 },
      { key: 'hmis', label: 'hmis', defaultValue: 4 },
    ],
  },
];

const BASE_SECTION_OPTIONS = GEOMETRY_OPTIONS.filter(
  (option) => option.key === 'rectangular-section' || option.key === 'circle-section'
);
const SECTION_T_OPTIONS = GEOMETRY_OPTIONS.filter((option) => option.key.startsWith('t-'));
const SECTION_I_OPTIONS = GEOMETRY_OPTIONS.filter((option) => option.key.startsWith('i-'));

const buildInitialParams = (option: GeometryOption): Record<string, string> => {
  return option.fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = String(field.defaultValue);
    return acc;
  }, {});
};

const buildGeometryProxyPath = (path: string): string => `/api${path}`;

const getFieldUnit = (field: GeometryField): string | null => {
  if (field.unit !== undefined) {
    return field.unit || null;
  }

  if (field.key === 'points') {
    return null;
  }

  return 'cm';
};

const getFieldSymbol = (field: GeometryField): ReactNode => {
  switch (field.key) {
    case 'bf':
      return <>b<sub>f</sub></>;
    case 'hf':
      return <>h<sub>f</sub></>;
    case 'bw':
      return <>b<sub>w</sub></>;
    case 'bi':
      return <>b<sub>i</sub></>;
    case 'hi':
      return <>h<sub>i</sub></>;
    case 'bmis':
      return <>b<sub>mis</sub></>;
    case 'hmis':
      return <>h<sub>mis</sub></>;
    case 'bmissup':
      return <>b<sub>mis,sup</sub></>;
    case 'hmissup':
      return <>h<sub>mis,sup</sub></>;
    case 'bmisinf':
      return <>b<sub>mis,inf</sub></>;
    case 'hmisinf':
      return <>h<sub>mis,inf</sub></>;
    default:
      return field.label;
  }
};

const formatTitle = (rawKey: string): string => {
  return rawKey
    .replace(/\[(\d+)\]/g, ' $1')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

const normalizeKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const RESULT_CONTAINER_KEYS = new Set([
  'geometricproperties',
  'geometricproperty',
  'properties',
  'property',
  'results',
  'result',
]);

const INPUT_REQUEST_KEYS = new Set([
  'input',
  'inputs',
  'param',
  'params',
  'parameter',
  'parameters',
  'request',
  'payload',
  'geometrytype',
  'geometry',
  'endpoint',
]);

const shouldSkipResultKey = (key: string): boolean => INPUT_REQUEST_KEYS.has(normalizeKey(key));

const getDisplayKeyFromPath = (path: string): string => {
  if (!path.trim()) {
    return 'resultado';
  }

  const segments = path
    .split('.')
    .map((segment) => segment.replace(/\[(\d+)\]/g, '').trim())
    .filter(Boolean)
    .filter((segment) => !RESULT_CONTAINER_KEYS.has(normalizeKey(segment)));

  return segments.length > 0 ? segments[segments.length - 1] : 'resultado';
};

const inferUnit = (key: string): string => {
  const normalized = key.toLowerCase();

  if (normalized.includes('points')) {
    return '-';
  }
  if (normalized.includes('area')) {
    return 'cm²';
  }
  if (normalized.includes('volume')) {
    return 'cm³';
  }
  if (normalized.includes('inerc')) {
    return 'cm⁴';
  }
  if (/(^|\W)(b|h|r|x|y|z|bf|bw|bi|hf|hi|bmis|hmis)(\W|$)/.test(normalized)) {
    return 'cm';
  }

  return '-';
};

const formatTableValue = (rawValue: unknown): string => {
  const formatNumber = (numericValue: number, sourceDecimalLength: number): string => {
    const decimalsToUse = sourceDecimalLength > 2 ? 2 : sourceDecimalLength;

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimalsToUse,
      maximumFractionDigits: decimalsToUse,
    }).format(numericValue);
  };

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    const decimalPart = String(rawValue).split('.')[1] ?? '';
    return formatNumber(rawValue, decimalPart.length);
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    const numericPattern = /^-?\d+(?:[.,]\d+)?$/;

    if (!numericPattern.test(trimmed)) {
      return rawValue;
    }

    const normalized = trimmed.replace(',', '.');
    const numericValue = Number(normalized);

    if (!Number.isFinite(numericValue)) {
      return rawValue;
    }

    const decimalPart = trimmed.includes(',')
      ? trimmed.split(',')[1] ?? ''
      : trimmed.split('.')[1] ?? '';

    return formatNumber(numericValue, decimalPart.length);
  }

  return rawValue !== undefined && rawValue !== null ? String(rawValue) : '-';
};

const buildResultRows = (value: unknown, path = ''): ResultRow[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const displayKey = getDisplayKeyFromPath(path);

    return [
      {
        title: formatTitle(displayKey),
          value: formatTableValue(value),
        unit: inferUnit(displayKey),
      },
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => buildResultRows(item, `${path}[${index}]`));
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;

    if (
      ('value' in objectValue || 'valor' in objectValue) &&
      ('unit' in objectValue || 'unidade' in objectValue)
    ) {
      const displayKey = getDisplayKeyFromPath(path);
      const rawValue = 'value' in objectValue ? objectValue.value : objectValue.valor;
      const rawUnit = 'unit' in objectValue ? objectValue.unit : objectValue.unidade;

      return [
        {
          title: formatTitle(displayKey),
          value: formatTableValue(rawValue),
          unit: rawUnit !== undefined && rawUnit !== null && String(rawUnit).trim() !== '' ? String(rawUnit) : '-',
        },
      ];
    }

    if ('title' in objectValue && ('value' in objectValue || 'valor' in objectValue)) {
      const displayKey = getDisplayKeyFromPath(path);
      const rawTitle = objectValue.title;
      const rawValue = 'value' in objectValue ? objectValue.value : objectValue.valor;
      const rawUnit = 'unit' in objectValue ? objectValue.unit : objectValue.unidade;

      return [
        {
          title: typeof rawTitle === 'string' ? rawTitle : formatTitle(displayKey),
          value: formatTableValue(rawValue),
          unit: rawUnit !== undefined && rawUnit !== null && String(rawUnit).trim() !== '' ? String(rawUnit) : inferUnit(displayKey),
        },
      ];
    }

    return Object.entries(objectValue).flatMap(([key, nested]) => {
      if (shouldSkipResultKey(key)) {
        return [];
      }

      return buildResultRows(nested, path ? `${path}.${key}` : key);
    });
  }

  return [];
};

export default function GeometriaPage() {
  const configItems: MenuItem[] = [
    { label: 'Configurações', href: '/settings', icon: Settings },
  ];

  const [selectedGeometry, setSelectedGeometry] = useState<GeometryOptionKey>('rectangular-section');

  const selectedOption = useMemo(
    () => GEOMETRY_OPTIONS.find((option) => option.key === selectedGeometry) ?? GEOMETRY_OPTIONS[0],
    [selectedGeometry]
  );

  const [params, setParams] = useState<Record<string, string>>(
    buildInitialParams(GEOMETRY_OPTIONS[0])
  );

  const endpointPath = selectedOption.endpoint;
  const endpointUrl = buildGeometryProxyPath(endpointPath);

  const {
    isSending,
    responseText,
    apiResponseData,
    resultRows,
    requestError,
    submitGeometry,
    reset,
  } = useGeometryCalculation<ResultRow>({
    buildResultRows,
  });

  const payload = useMemo(() => {
    return Object.entries(params).reduce<Record<string, number>>((acc, [key, value]) => {
      const parsed = Number(value);
      acc[key] = Number.isNaN(parsed) ? 0 : parsed;
      return acc;
    }, {});
  }, [params]);

  const handleGeometryChange = (value: string) => {
    const option = GEOMETRY_OPTIONS.find((item) => item.key === value);
    if (!option) {
      return;
    }

    setSelectedGeometry(option.key);
    setParams(buildInitialParams(option));
    reset();
  };

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handlePostGeometry = async () => {
    await submitGeometry(endpointUrl, payload);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar
          configItems={configItems}
          configGroupLabel="Configurações"
        />

        <div className="w-full">
          <div className={styles.headerStyles.container}>
            <div className={`${styles.headerStyles.wrapper} pl-12`}>
              <h1 className={styles.headerStyles.title + ' ' + styles.fontSizesResponsive.pageTitle}>
                Geometria
              </h1>
              <p className={styles.headerStyles.subtitle + ' ' + styles.fontSizesResponsive.subtitle}>
                Calculadora de figuras bidimensionais
              </p>
            </div>
          </div>

          <div className="px-3 py-3 lg:px-4 lg:py-4">
            <div className="grid grid-cols-1 gap-3 lg:h-[calc(100vh-12rem)] lg:grid-cols-2">
            <div className="flex h-full flex-col gap-3 lg:overflow-auto">
              <DashboardPanelCard title="Entradas">
                  <div className="mb-2">
                    <div className="space-y-2">
                      <div className="w-full space-y-1">
                        <Label htmlFor="geometry-type">Tipo de geometria</Label>
                        <Select value={selectedGeometry} onValueChange={handleGeometryChange}>
                          <SelectTrigger id="geometry-type" className="w-full">
                            <SelectValue placeholder="Selecione a geometria" />
                          </SelectTrigger>
                          <SelectContent>
                            {BASE_SECTION_OPTIONS.map((option) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}

                            <SelectSeparator />

                            <SelectGroup>
                              <SelectLabel>Seção T</SelectLabel>
                              {SECTION_T_OPTIONS.map((option) => (
                                <SelectItem key={option.key} value={option.key}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>

                            <SelectSeparator />

                            <SelectGroup>
                              <SelectLabel>Seção I</SelectLabel>
                              {SECTION_I_OPTIONS.map((option) => (
                                <SelectItem key={option.key} value={option.key}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                          {selectedOption.fields.map((field) => {
                            const unit = getFieldUnit(field);
                            const symbol = getFieldSymbol(field);

                            return (
                              <InputNumber
                                key={field.key}
                                id={field.key}
                                label={
                                  <>
                                    {symbol}
                                    {unit ? ` (${unit})` : ''}
                                  </>
                                }
                                value={params[field.key] ?? ''}
                                onChange={(value) => handleParamChange(field.key, String(value))}
                                step={field.key === 'points' ? 1 : 0.01}
                                min={0}
                                inputWidth="w-24"
                                labelWidth="min-w-[86px]"
                                className="min-w-[180px] flex-1 rounded-md border border-border/60 bg-muted/20 px-2 py-1 md:flex-none"
                              />
                            );
                          })}
                        </div>

                        <Button className="h-9 w-full shrink-0 self-center sm:w-auto" onClick={handlePostGeometry} disabled={isSending}>
                          {isSending ? 'Enviando...' : 'Calcular'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {requestError ? (
                    <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-sm text-destructive">
                      {requestError}
                    </p>
                  ) : null}
              </DashboardPanelCard>

              <DashboardPanelCard
                title="Resultados"
                tooltipContent="Cada mini tabela apresenta uma propriedade calculada: primeira coluna é o título da propriedade, segunda coluna é o valor numérico e terceira coluna é a unidade."
                className="mt-auto"
              >
                  {resultRows.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {resultRows.map((row, index) => (
                        <div
                          key={`${row.title}-${index}`}
                          className="w-full rounded-md border border-border/70 bg-background/70 sm:w-[calc(50%-0.25rem)] xl:w-[calc(33.333%-0.34rem)]"
                        >
                          <div className="grid grid-cols-3 text-xs">
                            <div className="border-r border-border px-2 py-1.5 text-muted-foreground">{row.title}</div>
                            <div className="border-r border-border px-2 py-1.5 text-foreground">{row.value}</div>
                            <div className="px-2 py-1.5 text-muted-foreground">{row.unit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {responseText ? (
                    <div className="mt-2 rounded-md border border-border bg-muted/30 p-2">
                      <p className="mb-1.5 text-sm font-medium">Resposta</p>
                      <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{responseText}</pre>
                    </div>
                  ) : null}
              </DashboardPanelCard>
            </div>

            <div className="flex h-full flex-col gap-3 lg:overflow-auto">
              <DashboardPanelCard title="Visualização 3D">
                  <Section3DViewer sectionType={selectedGeometry} parameters={payload} />
              </DashboardPanelCard>

              <ApiRequestResponsePanel
                className="mt-auto"
                endpoint={`POST ${endpointUrl}`}
                requestPayload={payload}
                responseData={apiResponseData}
                requestLabel="Chamada para API"
                responseLabel="Resposta da API"
              />
            </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
