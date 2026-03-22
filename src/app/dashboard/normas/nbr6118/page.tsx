'use client';

import Link from 'next/link';
import { BookOpen, LibraryBig, Table2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '@/components/user/molecules/sidebar';

export default function Nbr6118DashboardPage() {
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
      isActive: true,
    },
    {
      label: 'Catalogo de tabelas',
      href: '/dashboard/normas/nbr6118/tabelas',
      icon: Table2,
    },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
        <AppSidebar menuItems={menuItems} menuGroupLabel="Navegação" />

        <div className="w-full">
          <div className="border-b border-slate-200 bg-white/90 px-3 py-4 shadow-sm backdrop-blur lg:px-4">
            <div className="mx-auto w-full max-w-6xl pl-12">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Norma Técnica</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">NBR 6118</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-700">
                Área dedicada à navegação da NBR 6118, preparada para concentrar tabelas, métodos e futuras ferramentas
                derivadas da norma.
              </p>
            </div>
          </div>

          <main className="px-3 py-3 lg:px-4 lg:py-4">
            <div className="mx-auto grid w-full max-w-6xl gap-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Modulo da norma</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Explorar conteudo da NBR 6118</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                      A partir daqui o usuário pode navegar pelo catálogo de tabelas da norma e, no futuro, acessar os
                      métodos HTTP associados a cada tabela.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/normas/nbr6118/tabelas"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                  >
                    <Table2 className="h-4 w-4" />
                    Abrir catálogo de tabelas
                  </Link>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
