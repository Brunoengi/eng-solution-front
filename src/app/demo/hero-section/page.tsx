import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Braces,
  DraftingCompass,
  Layers3,
  Network,
  Ruler,
  Sigma,
  Workflow,
} from 'lucide-react';

import { GridContainer } from '@/components/user/layout/grid-layout';
import { HeroBeamMoment } from '@/components/user/molecules/hero-beam-moment';
import { Button } from '@/components/ui/button';

const heroHighlights = [
  {
    icon: DraftingCompass,
    title: 'Modelagem com leitura objetiva',
    description: 'Organize geometria, apoios e carregamentos com mais clareza desde o inicio do estudo.',
  },
  {
    icon: Sigma,
    title: 'Resultados tecnicos em evidencia',
    description: 'Acompanhe diagramas, visualizacoes e memoriais com foco na interpretacao estrutural.',
  },
  {
    icon: BookOpen,
    title: 'Normas e referencias por perto',
    description: 'Consulte conteudos tecnicos sem sair do fluxo principal de analise e dimensionamento.',
  },
  {
    icon: Braces,
    title: 'Interface e integracao no mesmo ambiente',
    description: 'Use os modulos prontos ou conecte os calculos aos seus proprios fluxos de trabalho.',
  },
];

const metaItems = [
  { label: 'Modulo', value: 'Viga de concreto armado' },
  { label: 'Saida', value: 'Diagramas e verificacoes' },
  { label: 'Integracao', value: 'Interface e servicos internos' },
];

function HeroCopyBlock() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-[rgba(14,116,144,0.18)] bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">
          Solucoes para engenharia estrutural
        </span>
        <span className="inline-flex rounded-full border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">
          Plataforma tecnica
        </span>
      </div>

      <div className="space-y-3">
        <h2 className="max-w-[15ch] text-[clamp(2.35rem,4.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-[rgb(15,23,42)]">
          Calculo, dimensionamento e consulta tecnica em um fluxo continuo de trabalho.
        </h2>
        <p className="max-w-3xl text-base leading-7 text-[rgb(71,85,105)]">
          Reuna modelagem, visualizacao estrutural, verificacoes e acesso a normas em um ambiente pensado para apoiar
          decisoes de projeto com mais agilidade.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-[rgb(15,23,42)] px-6 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] hover:bg-[rgb(30,41,59)]"
        >
          <Link href="/dashboard/viga-concreto-armado">
            Explorar dimensionamento
            <ArrowRight />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full border-[rgba(15,23,42,0.14)] bg-white/70 px-6 text-[rgb(15,23,42)] hover:bg-white"
        >
          <Link href="/dashboard/geometria">Abrir modulo de geometria</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="rounded-full px-5 text-[rgb(15,23,42)] hover:bg-[rgba(15,23,42,0.05)]"
        >
          <Link href="/#modules">Ver modulos</Link>
        </Button>
      </div>
    </div>
  );
}

function HighlightGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {heroHighlights.map(({ icon: Icon, title, description }) => (
        <article
          key={title}
          className="rounded-3xl border border-white/70 bg-white/76 p-4 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)]"
        >
          <div className="mb-3 inline-flex rounded-2xl bg-[rgba(14,116,144,0.12)] p-2 text-[rgb(14,116,144)]">
            <Icon className="size-4" />
          </div>
          <h3 className="text-sm font-semibold text-[rgb(15,23,42)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
        </article>
      ))}
    </div>
  );
}

function MetaStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metaItems.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 p-3 text-white/90">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[rgba(148,163,184,0.9)]">{item.label}</p>
          <p className="mt-1 text-sm font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">Caso {index}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[rgb(15,23,42)]">{title}</h2>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
    </div>
  );
}

function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.86))] p-5 shadow-[0_35px_80px_-55px_rgba(15,23,42,0.45)] md:p-7">
      {children}
    </section>
  );
}

export default function HeroSectionDemoPage() {
  return (
    <div className="min-h-screen bg-[rgb(246,247,251)]">
      <div className="border-b border-white/70 bg-[rgba(246,247,251,0.86)] backdrop-blur">
        <GridContainer className="max-w-[1440px] py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[rgb(14,116,144)]">Demo</p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[rgb(15,23,42)]">Hero Section Lab</h1>
              <p className="max-w-3xl text-sm leading-6 text-[rgb(71,85,105)]">
                Cinco propostas para a area de Analise em destaque, sem tocar na homepage definitiva.
              </p>
            </div>

            <Button asChild variant="outline" className="w-fit rounded-full bg-white/75">
              <Link href="/">
                <ArrowLeft />
                Voltar para a home
              </Link>
            </Button>
          </div>
        </GridContainer>
      </div>

      <main>
        <GridContainer className="max-w-[1440px] space-y-8 py-8 md:space-y-10 md:py-10">
          <DemoShell>
            <SectionHeader
              index="01"
              title="Preview escapando do container"
              description="A area tecnica avanca alem do limite da moldura para ganhar presenca visual sem parecer so mais um card encaixado."
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-center">
              <div className="space-y-6">
                <HeroCopyBlock />
                <HighlightGrid />
              </div>

              <div className="relative xl:pl-8">
                <div className="pointer-events-none absolute -right-6 -top-6 hidden h-20 w-20 rounded-full bg-[rgba(249,115,22,0.18)] blur-2xl xl:block" />
                <div className="rounded-[2rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95))] p-4 shadow-[0_45px_90px_-52px_rgba(15,23,42,0.9)] xl:translate-x-6">
                  <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(15,23,42,0.55)] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(191,219,254,0.76)]">
                          Analise em destaque
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Preview com escape</h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/80">
                        Hero principal
                      </span>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(248,250,252,0.96)] p-2">
                      <HeroBeamMoment viewerHeightClassName="h-[320px] min-h-[320px] lg:h-[360px] lg:min-h-[360px]" />
                    </div>
                    <div className="mt-4">
                      <MetaStrip />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DemoShell>

          <DemoShell>
            <SectionHeader
              index="02"
              title="Shell simplificado"
              description="Menos caixas empilhadas, mais leitura de um unico painel tecnico com viewer dominante e barra inferior condensada."
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-center">
              <div className="space-y-6">
                <HeroCopyBlock />
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-3xl border border-white/70 bg-white/78 p-4">
                    <div className="mb-3 inline-flex rounded-2xl bg-[rgba(14,116,144,0.12)] p-2 text-[rgb(14,116,144)]">
                      <Workflow className="size-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[rgb(15,23,42)]">Menos moldura, mais conteudo</h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(71,85,105)]">
                      A experiencia fica mais limpa quando o painel tecnico nao precisa simular tantos niveis.
                    </p>
                  </article>
                  <article className="rounded-3xl border border-white/70 bg-white/78 p-4">
                    <div className="mb-3 inline-flex rounded-2xl bg-[rgba(15,23,42,0.08)] p-2 text-[rgb(15,23,42)]">
                      <Layers3 className="size-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[rgb(15,23,42)]">Barra inferior enxuta</h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(71,85,105)]">
                      Metadados condensados em uma unica faixa, com mais cara de software tecnico.
                    </p>
                  </article>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(15,23,42,0.99),rgba(30,41,59,0.94))] p-4 shadow-[0_45px_90px_-52px_rgba(15,23,42,0.9)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(191,219,254,0.76)]">
                      Workspace tecnico
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Um painel so</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/80">
                    Estrutura simplificada
                  </span>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-[rgba(248,250,252,0.97)] p-2">
                  <HeroBeamMoment viewerHeightClassName="h-[340px] min-h-[340px] lg:h-[390px] lg:min-h-[390px]" />
                </div>
                <div className="mt-4 grid gap-2 rounded-[1.4rem] border border-white/10 bg-white/6 p-3 text-white/88 sm:grid-cols-3">
                  {metaItems.map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                      <p className="mt-1 text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DemoShell>

          <DemoShell>
            <SectionHeader
              index="03"
              title="Workspace dominante"
              description="O painel tecnico vira protagonista e o texto comercial passa a atuar como introducao lateral mais enxuta."
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.75fr)_minmax(0,1.25fr)] xl:items-center">
              <div className="space-y-6 rounded-[1.8rem] border border-white/70 bg-white/78 p-5">
                <div className="inline-flex rounded-full border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">
                  Workspace dominante
                </div>
                <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[rgb(15,23,42)]">
                  Uma tela para ver, explorar e decidir.
                </h2>
                <p className="text-base leading-7 text-[rgb(71,85,105)]">
                  Quando o preview tecnico domina o hero, a homepage passa a parecer mais proxima do produto em uso.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Ruler, label: 'Dimensionamento orientado a fluxo' },
                    { icon: Network, label: 'Visualizacao e leitura do modelo' },
                    { icon: BookOpen, label: 'Normas e memoriais ao redor do processo' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-[rgba(148,163,184,0.2)] bg-white/82 px-4 py-3">
                      <div className="rounded-xl bg-[rgba(14,116,144,0.12)] p-2 text-[rgb(14,116,144)]">
                        <Icon className="size-4" />
                      </div>
                      <p className="text-sm font-medium text-[rgb(15,23,42)]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(15,23,42,0.99),rgba(30,41,59,0.95))] p-4 shadow-[0_45px_90px_-52px_rgba(15,23,42,0.9)]">
                <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 text-white/85">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Modo de apresentacao</p>
                    <p className="mt-1 text-sm font-medium">Viewer dominante</p>
                  </div>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs">
                    Pronto para explorar
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(248,250,252,0.97)] p-2">
                  <HeroBeamMoment viewerHeightClassName="h-[360px] min-h-[360px] lg:h-[440px] lg:min-h-[440px]" />
                </div>
              </div>
            </div>
          </DemoShell>

          <DemoShell>
            <SectionHeader
              index="04"
              title="Composicao assimetrica"
              description="A area de analise se desloca, recebe badges flutuantes e quebra a simetria para parecer mais autoral."
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-center">
              <div className="space-y-6">
                <HeroCopyBlock />
                <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-4">
                  <HighlightGrid />
                </div>
              </div>

              <div className="relative xl:pl-10">
                <div className="pointer-events-none absolute left-4 top-6 hidden rounded-full border border-[rgba(14,116,144,0.18)] bg-white/88 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(14,116,144)] xl:block">
                  Analise ao vivo
                </div>
                <div className="pointer-events-none absolute -right-4 top-16 hidden rounded-full border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(154,52,18)] xl:block">
                  Painel flutuante
                </div>
                <div className="rounded-[2.1rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.92))] p-4 shadow-[0_50px_100px_-58px_rgba(15,23,42,0.9)] xl:translate-x-4 xl:-rotate-[1.2deg]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-3 xl:rotate-[1.2deg]">
                    <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(248,250,252,0.97)] p-2">
                      <HeroBeamMoment viewerHeightClassName="h-[320px] min-h-[320px] lg:h-[370px] lg:min-h-[370px]" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {[
                        'Leitura visual imediata',
                        'Detalhes tecnicos em foco',
                        'Mais presenca no hero',
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-white/85"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DemoShell>

          <DemoShell>
            <SectionHeader
              index="05"
              title="Viewer separado das informacoes"
              description="O preview tecnico deixa de carregar sozinho o resto das informacoes e passa a conviver com um painel secundario independente."
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_320px] xl:items-start">
              <div className="space-y-6">
                <HeroCopyBlock />
                <div className="rounded-[2rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(15,23,42,0.99),rgba(30,41,59,0.95))] p-4 shadow-[0_45px_90px_-52px_rgba(15,23,42,0.9)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(191,219,254,0.76)]">
                        Viewer principal
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">Preview isolado</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/80">
                      Painel independente
                    </span>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(248,250,252,0.97)] p-2">
                    <HeroBeamMoment viewerHeightClassName="h-[340px] min-h-[340px] lg:h-[390px] lg:min-h-[390px]" />
                  </div>
                </div>
              </div>

              <aside className="space-y-4 rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_30px_70px_-52px_rgba(15,23,42,0.4)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">Painel lateral</p>
                  <h3 className="mt-2 text-xl font-semibold text-[rgb(15,23,42)]">Contexto tecnico</h3>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      icon: Layers3,
                      title: 'Leitura modular',
                      description: 'O preview visual fica livre para dominar o hero, enquanto os dados vivem em um painel proprio.',
                    },
                    {
                      icon: Workflow,
                      title: 'Mais flexibilidade',
                      description: 'Voce pode testar ordem, densidade e prioridade da informacao sem mexer no viewer.',
                    },
                    {
                      icon: Network,
                      title: 'Boa base para evolucao',
                      description: 'Essa estrutura facilita levar a mesma linguagem para dashboards e modulos futuros.',
                    },
                  ].map(({ icon: Icon, title, description }) => (
                    <article
                      key={title}
                      className="rounded-[1.35rem] border border-[rgba(148,163,184,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.9))] p-4"
                    >
                      <div className="mb-3 inline-flex rounded-2xl bg-[rgba(15,23,42,0.06)] p-2 text-[rgb(14,116,144)]">
                        <Icon className="size-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-[rgb(15,23,42)]">{title}</h4>
                      <p className="mt-2 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
                    </article>
                  ))}
                </div>

                <Button asChild className="w-full rounded-full bg-[rgb(15,23,42)] text-white hover:bg-[rgb(30,41,59)]">
                  <Link href="/dashboard/portico-plano">
                    Explorar estrutura semelhante
                    <ArrowRight />
                  </Link>
                </Button>
              </aside>
            </div>
          </DemoShell>
        </GridContainer>
      </main>
    </div>
  );
}
