import Link from 'next/link';
import { ArrowRight, BookOpen, Braces, DraftingCompass, Sigma } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HeroBeamMoment } from '@/components/user/molecules/hero-beam-moment';

const heroHighlights = [
  {
    icon: DraftingCompass,
    title: 'Modelagem com leitura objetiva',
    description: 'Organize geometria, apoios e carregamentos com mais clareza desde o início do estudo.',
  },
  {
    icon: Sigma,
    title: 'Resultados técnicos em evidência',
    description: 'Acompanhe diagramas, visualizações e memoriais com foco na interpretação estrutural.',
  },
  {
    icon: BookOpen,
    title: 'Normas e referências por perto',
    description: 'Consulte conteúdos técnicos sem sair do fluxo principal de análise e dimensionamento.',
  },
  {
    icon: Braces,
    title: 'Interface e integração no mesmo ambiente',
    description: 'Use os módulos prontos ou conecte os cálculos aos seus próprios fluxos de trabalho.',
  },
];

const trustPills = ['NBR 6118', 'Visualizações 2D e 3D', 'Memoriais automatizados', 'Fluxo para API'];

export function HomeHero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.82))] px-5 py-6 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)] md:px-8 md:py-8"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.16),transparent_58%)]" />
      <div className="pointer-events-none absolute right-[-6rem] top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.18),transparent_70%)] blur-2xl" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)] xl:items-center">
        <div className="relative z-10 flex flex-col gap-6 xl:justify-center">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="home-eyebrow">Soluções para engenharia estrutural</span>
              <span className="rounded-full border border-[rgba(14,116,144,0.22)] bg-[rgba(14,116,144,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(14,116,144)]">
                Plataforma técnica
              </span>
            </div>

            <div className="space-y-3 xl:max-w-none">
              <h1 className="max-w-none text-[clamp(2.45rem,4.4vw,4.3rem)] font-semibold leading-[1] tracking-[-0.04em] text-[rgb(15,23,42)] xl:max-w-[50rem] xl:text-[3.1rem] xl:leading-[1.02] 2xl:max-w-[52rem] 2xl:text-[3.2rem]">
                Cálculo, dimensionamento e consulta técnica em um fluxo contínuo de trabalho.
              </h1>
              <p className="max-w-none text-base leading-7 text-[rgb(71,85,105)] lg:max-w-3xl xl:max-w-[46rem] 2xl:max-w-[48rem]">
                Reúna modelagem, visualização estrutural, verificações e acesso a normas em um ambiente pensado para
                apoiar decisões de projeto com mais agilidade.
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
                <Link href="/dashboard/geometria">Abrir módulo de geometria</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="rounded-full px-5 text-[rgb(15,23,42)] hover:bg-[rgba(15,23,42,0.05)]"
              >
                <a href="#modules">Ver módulos</a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {trustPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-[rgba(148,163,184,0.3)] bg-white/72 px-3 py-1.5 text-xs font-medium text-[rgb(51,65,85)] shadow-[0_10px_28px_-24px_rgba(15,23,42,0.4)]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroHighlights.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/70 bg-white/72 p-3.5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] backdrop-blur"
              >
                <div className="mb-3 inline-flex rounded-2xl bg-[rgba(14,116,144,0.12)] p-2 text-[rgb(14,116,144)]">
                  <Icon className="size-4" />
                </div>
                <h2 className="text-sm font-semibold text-[rgb(15,23,42)]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(148,163,184,0.24)] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(16,49,76,0.92)_42%,rgba(19,78,74,0.78)_100%)] p-4 shadow-[0_45px_90px_-52px_rgba(15,23,42,0.82)] md:p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_58%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_42%)]" />
            <div className="pointer-events-none absolute -bottom-8 left-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.18),transparent_70%)] blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(186,230,253,0.9)]">
                    Análise em destaque
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Visualização estrutural aplicada</h2>
                </div>
                <div className="rounded-full border border-[rgba(186,230,253,0.18)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-[rgba(240,249,255,0.92)]">
                  Ambiente interativo
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(239,246,255,0.94))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_40px_-28px_rgba(15,23,42,0.65)]">
                <HeroBeamMoment viewerHeightClassName="h-[280px] min-h-[280px] lg:h-[320px] lg:min-h-[320px] 2xl:h-[350px] 2xl:min-h-[350px]" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.2),rgba(15,23,42,0.08))] p-3 text-white/95">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[rgba(186,230,253,0.92)]">Módulo</p>
                  <p className="mt-1 text-sm font-medium">Viga de concreto armado</p>
                </div>
                <div className="rounded-2xl border border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] p-3 text-white/95">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[rgba(254,240,138,0.94)]">Saída</p>
                  <p className="mt-1 text-sm font-medium">Diagramas e verificações</p>
                </div>
                <div className="rounded-2xl border border-[rgba(74,222,128,0.2)] bg-[linear-gradient(180deg,rgba(21,128,61,0.18),rgba(15,23,42,0.08))] p-3 text-white/95">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[rgba(187,247,208,0.94)]">Integração</p>
                  <p className="mt-1 text-sm font-medium">Interface e serviços internos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
