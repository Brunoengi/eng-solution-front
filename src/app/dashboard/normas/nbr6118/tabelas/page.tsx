'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, LibraryBig, Table2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';
import { getNbr6118Tables } from '@/services/api/nbr6118';
import type { Nbr6118Entry } from '@/types/nbr6118';

const THEME_LABELS: Record<string, string> = {
  actions: 'A\u00e7\u00f5es',
  detailing: 'Detalhamento',
  durability: 'Durabilidade',
  materials: 'Materiais',
};

const compareChapterIds = (left: string, right: string): number => {
  const leftValue = Number.parseInt(left, 10);
  const rightValue = Number.parseInt(right, 10);

  if (Number.isFinite(leftValue) && Number.isFinite(rightValue) && leftValue !== rightValue) {
    return leftValue - rightValue;
  }

  return left.localeCompare(right);
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

export default function Nbr6118TablesIndexPage() {
  const menuItems: MenuItem[] = [
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
      isActive: true,
    },
  ];

  const [entries, setEntries] = useState<Nbr6118Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [themeFilter, setThemeFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getNbr6118Tables();

        if (!mounted) {
          return;
        }

        setEntries(data);
      } catch (error) {
        if (!mounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Falha inesperada ao carregar as tabelas.';
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
  }, []);

  const availableChapters = useMemo(() => {
    return [...new Set(entries.map((entry) => entry.metadata.chapter ?? '').filter(Boolean))].sort(compareChapterIds);
  }, [entries]);

  const availableThemes = useMemo(() => {
    return Object.keys(THEME_LABELS).filter((theme) =>
      entries.some((entry) => entry.metadata.themes?.includes(theme)),
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return entries.filter((entry) => {
      const { metadata } = entry;

      const textMatches =
        normalizedSearch.length === 0 ||
        metadata.label.toLowerCase().includes(normalizedSearch) ||
        metadata.title.toLowerCase().includes(normalizedSearch) ||
        (metadata.table ?? '').toLowerCase().includes(normalizedSearch) ||
        (metadata.clause ?? '').toLowerCase().includes(normalizedSearch);

      const chapterMatches = chapterFilter === 'all' || metadata.chapter === chapterFilter;
      const themeMatches = themeFilter === 'all' || Boolean(metadata.themes?.includes(themeFilter));

      return textMatches && chapterMatches && themeMatches;
    });
  }, [chapterFilter, entries, searchText, themeFilter]);

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
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{'Norma T\u00e9cnica'}</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">Tabelas catalogadas da NBR 6118</h1>
              <p className="mt-2 text-sm text-slate-700">
                {`A API atualmente retorna ${entries.length} tabela(s) normativa(s) numerada(s) para o cat\u00e1logo da NBR 6118.`}
              </p>
            </div>
          </div>

          <main className="px-3 py-3 lg:px-4 lg:py-4">
            <div className="mx-auto w-full max-w-6xl space-y-4">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    {'Buscar por tabela, t\u00edtulo ou cl\u00e1usula'}
                    <input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Ex.: 11.3, combinacoes, 11.8.2.4"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    {'Cap\u00edtulo'}
                    <select
                      value={chapterFilter}
                      onChange={(event) => setChapterFilter(event.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    >
                      <option value="all">Todos</option>
                      {availableChapters.map((chapter) => (
                        <option key={chapter} value={chapter}>
                          {chapter}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Tema
                    <select
                      value={themeFilter}
                      onChange={(event) => setThemeFilter(event.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    >
                      <option value="all">Todos</option>
                      {availableThemes.map((theme) => (
                        <option key={theme} value={theme}>
                          {THEME_LABELS[theme] ?? theme}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                {isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                    Carregando tabelas da NBR 6118...
                  </div>
                ) : null}

                {!isLoading && errorMessage ? (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                    {errorMessage}
                  </div>
                ) : null}

                {!isLoading && !errorMessage ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">{filteredEntries.length} tabela(s) encontrada(s).</p>

                    {filteredEntries.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                        Nenhuma tabela corresponde aos filtros atuais.
                      </div>
                    ) : null}

                    {filteredEntries.map((entry) => {
                      const tableId = entry.metadata.table ?? entry.metadata.sourceId;

                      return (
                        <article key={entry.metadata.sourceId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="rounded bg-slate-100 px-2 py-1 font-semibold">{entry.metadata.label}</span>
                            {entry.metadata.chapter ? <span>{`Cap\u00edtulo ${entry.metadata.chapter}`}</span> : null}
                            {entry.metadata.clause ? <span>{`Cl\u00e1usula ${entry.metadata.clause}`}</span> : null}
                          </div>

                          <h2 className="mt-2 text-lg font-semibold text-slate-900">
                            <InlineFragments
                              fragments={entry.metadata.titleFragments}
                              fallbackText={entry.metadata.title}
                            />
                          </h2>

                          {entry.metadata.themes?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.metadata.themes.map((theme) => (
                                <span key={`${entry.metadata.sourceId}-${theme}`} className="rounded bg-cyan-50 px-2 py-1 text-xs text-cyan-800">
                                  {theme}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-3">
                            <Link
                              href={`/dashboard/normas/nbr6118/tabelas/${encodeURIComponent(tableId)}`}
                              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                            >
                              Abrir detalhe da tabela
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
