'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../../components/user/molecules/sidebar';
import { useVigaConcretoArmado } from '@/features/viga-concreto-armado/context/viga-concreto-armado-provider';
import { Layers, ArrowUpDown, Anchor, Square, Settings, FileText, Link, Home } from 'lucide-react';

export default function EsforcosSolicitantesPage() {
  const {
    pilares,
    vigas,
    carregamentosPontuais,
    carregamentosDistribuidos,
    resultadosProcessamento,
    criteriosProjeto,
  } = useVigaConcretoArmado();

  const menuItems: MenuItem[] = [
    {
      label: 'Elementos e Carregamentos',
      href: '/dashboard/viga-concreto-armado',
      icon: Home,
    },
    {
      label: 'Dimensionamento',
      icon: Layers,
      items: [
        { label: 'Esforços Solicitantes', href: '/dashboard/viga-concreto-armado/esforcos-solicitantes', icon: ArrowUpDown, isActive: true },
        { label: 'Armadura Longitudinal', href: '/dashboard/viga-concreto-armado/longitudinal', icon: ArrowUpDown },
        { label: 'Armadura Transversal', href: '/dashboard/viga-concreto-armado/transversal', icon: Square },
        { label: 'Armadura de Suspensão', href: '/dashboard/viga-concreto-armado/suspensao', icon: Link },
        { label: 'Armadura de Ancoragem', href: '/dashboard/viga-concreto-armado/ancoragem', icon: Anchor },
        { label: 'Armadura de Pele', href: '/dashboard/viga-concreto-armado/pele', icon: Layers },
      ],
    },
  ];

  const exportItems: MenuItem[] = [
    { label: 'Memorial de Cálculo', href: '/dashboard/viga-concreto-armado/memorial-pdf', icon: FileText },
  ];

  const configItems: MenuItem[] = [
    { label: 'Critérios de Projeto', href: '/dashboard/viga-concreto-armado/criterios-projeto', icon: Settings },
  ];

  const possuiResultados = Boolean(
    resultadosProcessamento.segundoGenero || resultadosProcessamento.engastado
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar
          menuItems={menuItems}
          exportItems={exportItems}
          configItems={configItems}
          menuGroupLabel="Menu Principal"
          configGroupLabel="Configurações"
          exportGroupLabel="Exportar"
        />

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Esforços Solicitantes</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Leitura do estado compartilhado do módulo</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Esta página já consome o mesmo estado usado em elementos, carregamentos e critérios de projeto.
                Assim, os dados definidos nas outras telas podem ser reaproveitados sem recadastro.
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Pilares</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{pilares.length}</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Vigas</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{vigas.length}</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Cargas pontuais</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{carregamentosPontuais.length}</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Cargas distribuídas</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{carregamentosDistribuidos.length}</p>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Critérios ativos</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>γc: {criteriosProjeto.gammaC}</p>
                  <p>γs: {criteriosProjeto.gammaS}</p>
                  <p>γf: {criteriosProjeto.gammaF}</p>
                  <p>γ concreto: {criteriosProjeto.pesoEspecificoConcreto} kN/m3</p>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Resultados estruturais compartilhados</h2>
                {possuiResultados ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Modelo com apoios de segundo gênero</p>
                      <pre className="mt-2 max-h-[14rem] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                        {JSON.stringify(resultadosProcessamento.segundoGenero, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Modelo com apoios intermediários engastados</p>
                      <pre className="mt-2 max-h-[14rem] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                        {JSON.stringify(resultadosProcessamento.engastado, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    Nenhum resultado processado ainda. Execute o processamento em
                    `/dashboard/viga-concreto-armado` para compartilhar a saída com esta página.
                  </p>
                )}
              </article>
            </section>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
