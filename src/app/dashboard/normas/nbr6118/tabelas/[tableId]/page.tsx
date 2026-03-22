'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, LibraryBig, Table2 } from 'lucide-react';
import { NormativeTable } from '@/components/user/molecules/normative-table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import {
  Nbr6118ApiError,
  getNbr6118EntryBySourceId,
  getNbr6118TableById,
} from '@/services/api/nbr6118';
import type { Nbr6118Entry } from '@/types/nbr6118';

const prettyPrintJson = (value: unknown): string => {
  return JSON.stringify(value, null, 2);
};

const formatContextLabel = (value: string): string => {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

function InlineFragments({
  fragments,
  fallbackText,
}: {
  fragments?: Nbr6118Entry['metadata']['titleFragments'];
  fallbackText?: string;
}) {
  if (!fragments?.length) {
    return <>{fallbackText ?? null}</>;
  }

  return (
    <>
      {fragments.map((fragment, index) => {
        const key = `${fragment.kind ?? 'text'}-${index}-${fragment.text}`;

        if (fragment.kind === 'sub') {
          return <sub key={key}>{fragment.text}</sub>;
        }

        if (fragment.kind === 'sup') {
          return <sup key={key}>{fragment.text}</sup>;
        }

        if (fragment.kind === 'lineBreak') {
          return <br key={key} />;
        }

        return <span key={key}>{fragment.text}</span>;
      })}
    </>
  );
}

function ContextValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-slate-500">Nao informado.</p>;
  }

  if (typeof value === 'string') {
    const isFormula = /=|≤|≥|∑|γ|ψ|α|β|λ|μ|σ|Δ/.test(value);
    return (
      <p className={`text-sm leading-6 whitespace-pre-wrap ${isFormula ? 'font-mono text-[13px] text-slate-800' : 'text-slate-700'}`}>
        {value}
      </p>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <p className="font-mono text-sm text-slate-700">{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string' || typeof item === 'number')) {
      return (
        <ul className="space-y-2 text-sm text-slate-700">
          {value.map((item, index) => (
            <li key={`${String(item)}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
              {String(item)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <section key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Item {index + 1}</p>
            <ContextValue value={item} />
          </section>
        ))}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="space-y-3">
        {Object.entries(value).map(([key, nestedValue]) => (
          <section key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{formatContextLabel(key)}</h4>
            <div className="mt-2">
              <ContextValue value={nestedValue} />
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      {prettyPrintJson(value)}
    </pre>
  );
}

function NormativeContextSection({ context }: { context: unknown }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Contexto normativo</h2>
            <p className="text-sm text-slate-600">Explicacoes e referencias vindas de `payload.context`.</p>
          </div>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {isOpen ? 'Ocultar contexto' : 'Mostrar contexto'}
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="px-4 py-4 md:px-5">
          <ContextValue value={context} />
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function TechnicalPayloadSection({ payload }: { payload: Nbr6118Entry['payload'] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Payload tecnico</h2>
            <p className="text-sm text-slate-600">Mantido acessivel para regras, comparacoes e futuras features de dominio.</p>
          </div>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {isOpen ? 'Ocultar payload' : 'Mostrar payload'}
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <pre className="overflow-x-auto px-4 py-4 text-xs text-slate-700 md:px-5">{prettyPrintJson(payload)}</pre>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function MissingRepresentationFallback({ entry }: { entry: Nbr6118Entry }) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm md:p-5">
      <h2 className="text-base font-semibold text-amber-950">Representacao fiel ainda nao disponivel</h2>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        Esta entrada ainda nao possui `representation`. A tela permanece funcional com os metadados e o payload tecnico
        bruto para consulta.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-amber-200 bg-white p-3 text-xs text-slate-800">
        {prettyPrintJson({
          metadata: entry.metadata,
          payload: entry.payload,
        })}
      </pre>
    </section>
  );
}

export default function Nbr6118TableDetailPage() {
  const params = useParams<{ tableId: string }>();
  const tableId = useMemo(() => decodeURIComponent(params.tableId), [params.tableId]);
  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        label: 'Catálogo de normas',
        href: '/dashboard/normas',
        icon: LibraryBig,
      },
      {
        label: 'NBR 6118',
        href: '/dashboard/normas/nbr6118',
        icon: BookOpen,
      },
      {
        label: 'Catalogo de tabelas',
        href: '/dashboard/normas/nbr6118/tabelas',
        icon: Table2,
      },
      {
        label: `Tabela ${tableId}`,
        href: `/dashboard/normas/nbr6118/tabelas/${encodeURIComponent(tableId)}`,
        icon: Table2,
        isActive: true,
      },
    ],
    [tableId],
  );

  const [entry, setEntry] = useState<Nbr6118Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        let loadedEntry = await getNbr6118TableById(tableId);

        if (!loadedEntry) {
          loadedEntry = await getNbr6118EntryBySourceId(tableId);
        }

        if (!mounted) {
          return;
        }

        if (!loadedEntry) {
          setErrorMessage('Tabela nao encontrada para o identificador informado.');
          return;
        }

        setEntry(loadedEntry);
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof Nbr6118ApiError && error.status === 404) {
          try {
            const fallbackEntry = await getNbr6118EntryBySourceId(tableId);

            if (!mounted) {
              return;
            }

            if (fallbackEntry) {
              setEntry(fallbackEntry);
              setErrorMessage(null);
              return;
            }

            setErrorMessage('Tabela nao encontrada para o identificador informado.');
            return;
          } catch {
            if (mounted) {
              setErrorMessage('Tabela nao encontrada para o identificador informado.');
            }
            return;
          }
        }

        const message = error instanceof Error ? error.message : 'Falha inesperada ao carregar a tabela.';
        setErrorMessage(message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [tableId]);

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
        <AppSidebar
          menuItems={menuItems}
          menuGroupLabel="Navegacao"
        />

        <div className="w-full">
          <div className="border-b border-slate-200 bg-white/90 px-3 py-4 shadow-sm backdrop-blur lg:px-4">
            <div className="mx-auto w-full max-w-6xl pl-12">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Link href="/dashboard/normas/nbr6118/tabelas" className="font-medium text-slate-800 hover:underline">
                  Tabelas NBR 6118
                </Link>
                <span>/</span>
                <span>{tableId}</span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">NBR 6118</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">Detalhe da tabela normativa</h1>
              <p className="mt-2 text-sm text-slate-600">
                `metadata` para identificacao, `representation` para renderizacao e `payload` para inteligencia de dominio.
              </p>
            </div>
          </div>

          <main className="px-3 py-3 lg:px-4 lg:py-4">
            <div className="mx-auto w-full max-w-6xl space-y-4">
              {isLoading ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                  Carregando tabela {tableId}...
                </section>
              ) : null}

              {!isLoading && errorMessage ? (
                <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                  {errorMessage}
                </section>
              ) : null}

              {!isLoading && !errorMessage && entry ? (
                <>
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded bg-slate-100 px-2 py-1 font-semibold">{entry.metadata.label}</span>
                      <span className="rounded bg-slate-100 px-2 py-1">{entry.metadata.sourceType}</span>
                      <span className="text-slate-400">{entry.metadata.sourceId}</span>
                    </div>

                    <h2 className="mt-3 text-xl font-semibold text-slate-900">
                      <InlineFragments
                        fragments={entry.metadata.titleFragments}
                        fallbackText={entry.metadata.title}
                      />
                    </h2>

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tabela</dt>
                        <dd className="mt-1 text-slate-900">{entry.metadata.table ?? '-'}</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{'Cap\u00edtulo'}</dt>
                        <dd className="mt-1 text-slate-900">{entry.metadata.chapter ?? '-'}</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{'Cl\u00e1usula'}</dt>
                        <dd className="mt-1 text-slate-900">{entry.metadata.clause ?? '-'}</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{'Edi\u00e7\u00e3o'}</dt>
                        <dd className="mt-1 text-slate-900">{entry.metadata.edition === '2023' ? '2023' : '2023'}</dd>
                      </div>
                    </dl>

                    {entry.metadata.themes?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.metadata.themes.map((theme) => (
                          <span key={`${entry.metadata.sourceId}-${theme}`} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                            {theme}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {entry.representation ? <NormativeTable representation={entry.representation} /> : <MissingRepresentationFallback entry={entry} />}

                  {entry.payload?.context !== undefined ? <NormativeContextSection context={entry.payload.context} /> : null}

                  {entry.payload ? <TechnicalPayloadSection payload={entry.payload} /> : null}
                </>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
