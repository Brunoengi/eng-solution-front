import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, DraftingCompass, Network, Ruler } from 'lucide-react';

import { Button } from '@/components/ui/button';

const modules = [
  {
    title: 'Viga de concreto armado',
    description: 'Dimensionamento com foco em fluxo prático, verificações e organização de entradas.',
    href: '/dashboard/viga-concreto-armado',
    eyebrow: 'Dimensionamento',
    icon: Ruler,
    accent: 'from-[rgba(14,116,144,0.16)] via-[rgba(14,116,144,0.08)] to-transparent',
    className: 'lg:col-span-6',
  },
  {
    title: 'Pórtico plano',
    description: 'Modelagem estrutural com leitura mais direta para cenários de análise plana.',
    href: '/dashboard/portico-plano',
    eyebrow: 'Análise estrutural',
    icon: Building2,
    accent: 'from-[rgba(249,115,22,0.16)] via-[rgba(249,115,22,0.08)] to-transparent',
    className: 'lg:col-span-3',
  },
  {
    title: 'Pórtico espacial',
    description: 'Análise 3D com entrada por GDL, visualização híbrida e diagramas por estação.',
    href: '/dashboard/portico-espacial',
    eyebrow: 'Análise estrutural 3D',
    icon: Building2,
    accent: 'from-[rgba(2,132,199,0.16)] via-[rgba(2,132,199,0.08)] to-transparent',
    className: 'lg:col-span-3',
  },
  {
    title: 'Viga contínua',
    description: 'Fluxos para comportamento contínuo com base pronta para evoluções visuais e técnicas.',
    href: '/dashboard/viga-continua',
    eyebrow: 'Modelo estrutural',
    icon: Network,
    accent: 'from-[rgba(15,23,42,0.14)] via-[rgba(15,23,42,0.06)] to-transparent',
    className: 'lg:col-span-3',
  },
  {
    title: 'Geometria',
    description: 'Entrada inicial do sistema com potencial para se tornar o ponto de partida principal.',
    href: '/dashboard/geometria',
    eyebrow: 'Preparação',
    icon: DraftingCompass,
    accent: 'from-[rgba(59,130,246,0.16)] via-[rgba(59,130,246,0.08)] to-transparent',
    className: 'lg:col-span-4',
  },
  {
    title: 'Biblioteca de normas',
    description: 'Consulta técnica organizada para apoiar o processo de cálculo e documentação.',
    href: '/dashboard/normas',
    eyebrow: 'Referência',
    icon: BookOpen,
    accent: 'from-[rgba(22,163,74,0.16)] via-[rgba(22,163,74,0.08)] to-transparent',
    className: 'lg:col-span-4',
  },
  {
    title: 'Pilar em segunda ordem',
    description: 'Ferramenta especializada para verificações específicas em análises de segunda ordem.',
    href: '/dashboard/pilar-segunda-ordem-local',
    eyebrow: 'Especializado',
    icon: Ruler,
    accent: 'from-[rgba(168,85,247,0.16)] via-[rgba(168,85,247,0.08)] to-transparent',
    className: 'lg:col-span-4',
  },
];

export function HomeModulesGrid() {
  return (
    <section id="modules" className="space-y-6">
      <div className="max-w-2xl space-y-3">
        <span className="home-eyebrow">Módulos em destaque</span>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[rgb(15,23,42)] md:text-4xl">
          Escolha o ponto de partida mais adequado para o seu fluxo de trabalho.
        </h2>
        <p className="text-base leading-7 text-[rgb(71,85,105)]">
          Acesse rapidamente os principais módulos da plataforma para modelar, dimensionar, consultar normas e
          avançar nas verificações do seu estudo estrutural.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {modules.map(({ title, description, href, eyebrow, icon: Icon, accent, className }) => (
          <article
            key={title}
            className={`group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/82 p-5 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.38)] ${className}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-100 transition-opacity group-hover:opacity-90`} />
            <div className="relative flex h-full flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">{eyebrow}</p>
                  <h3 className="mt-3 text-xl font-semibold text-[rgb(15,23,42)]">{title}</h3>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 text-[rgb(15,23,42)]">
                  <Icon className="size-5" />
                </div>
              </div>

              <p className="max-w-md text-sm leading-6 text-[rgb(51,65,85)]">{description}</p>

              <div className="mt-auto pt-2">
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full px-0 text-[rgb(15,23,42)] hover:bg-transparent hover:text-[rgb(14,116,144)]"
                >
                  <Link href={href}>
                    Abrir módulo
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
