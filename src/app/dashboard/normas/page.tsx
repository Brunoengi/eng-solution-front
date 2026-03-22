'use client';

import Link from 'next/link';
import { BookOpen, Table2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';

interface NormCard {
  id: string;
  title: string;
  edition: string;
  status: 'available' | 'planned';
  summary: string;
  href?: string;
  features: string[];
}

const NORMS: NormCard[] = [
  {
    id: 'nbr6118',
    title: 'NBR 6118',
    edition: '2023',
    status: 'available',
    summary: 'Catalogo inicial com tabelas normativas mapeadas e acesso ao detalhe de cada tabela.',
    href: '/dashboard/normas/nbr6118/tabelas',
    features: ['Tabelas catalogadas', 'Filtro por capitulo e tema', 'Detalhe da tabela'],
  },
  {
    id: 'future-slot',
    title: 'Proximas normas',
    edition: 'Em expansao',
    status: 'planned',
    summary: 'Espaco reservado para novas normas, anexos, tabelas e futuras ferramentas de consulta.',
    features: ['Hub centralizado', 'Escalavel para multiplas normas', 'Mesma experiencia de navegacao'],
  },
];

export default function NormasDashboardPage() {
  const availableNorms = NORMS.filter((norm) => norm.status === 'available');

  const menuItems: MenuItem[] = availableNorms.map((norm) => ({
      label: norm.title,
      href: norm.href,
      icon: BookOpen,
    }));

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
        <AppSidebar
          menuItems={menuItems}
          menuGroupLabel="Normas"
          exitHref="/"
        />

        <div className="w-full">
          <div className="border-b border-slate-200 bg-white/90 px-3 py-4 shadow-sm backdrop-blur lg:px-4">
            <div className="mx-auto w-full max-w-6xl pl-12">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Biblioteca normativa</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">Dashboard de normas</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-700">
                Organize aqui todas as normas estruturais da plataforma. A NBR 6118 ja esta integrada, e esta pagina
                passa a ser o ponto unico de entrada para as proximas normas.
              </p>
            </div>
          </div>

          <main className="px-3 py-3 lg:px-4 lg:py-4">
            <div className="mx-auto grid w-full max-w-6xl gap-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Visao geral</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Normas disponiveis e futuras</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                      Estrutura preparada para crescer de uma norma isolada para um catalogo navegavel, com o mesmo
                      shell de dashboard e rotas dedicadas por norma.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/normas/nbr6118/tabelas"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                  >
                    <Table2 className="h-4 w-4" />
                    Abrir NBR 6118
                  </Link>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {NORMS.map((norm) => {
                  const isAvailable = norm.status === 'available';

                  return (
                    <article key={norm.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="rounded bg-slate-100 px-2 py-1 font-semibold">{norm.title}</span>
                        <span className="rounded bg-slate-100 px-2 py-1">{norm.edition}</span>
                        <span
                          className={`rounded px-2 py-1 font-medium ${
                            isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isAvailable ? 'Disponivel' : 'Planejada'}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-semibold text-slate-900">{norm.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{norm.summary}</p>

                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {norm.features.map((feature) => (
                          <li key={feature} className="rounded-lg bg-slate-50 px-3 py-2">
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5">
                        {norm.href ? (
                          <Link
                            href={norm.href}
                            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                          >
                            Explorar modulo
                          </Link>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-500">
                            Em preparacao
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
