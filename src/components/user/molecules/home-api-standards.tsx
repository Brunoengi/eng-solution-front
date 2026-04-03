import Link from 'next/link';
import { ArrowRight, BookOpen, Braces, Library, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function HomeApiStandards() {
  return (
    <section id="api" className="grid gap-4 lg:grid-cols-2">
      <article className="relative overflow-hidden rounded-[1.9rem] border border-[rgba(14,116,144,0.14)] bg-[linear-gradient(135deg,rgba(15,23,42,0.97),rgba(30,41,59,0.95))] p-6 text-white shadow-[0_34px_75px_-52px_rgba(15,23,42,0.9)]">
        <div className="pointer-events-none absolute right-[-3rem] top-[-4rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.34),transparent_70%)] blur-2xl" />
        <div className="relative space-y-5">
          <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(125,211,252,0.92)]">
            API e extensibilidade
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Leve os cálculos para fluxos próprios quando a interface não for suficiente.</h2>
            <p className="max-w-xl text-sm leading-6 text-[rgba(226,232,240,0.85)]">
              Combine a experiência da plataforma com integrações internas, automações e serviços voltados ao seu
              processo de engenharia.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-2 text-[rgba(125,211,252,0.92)]">
                <Braces className="size-4" />
              </div>
              <p className="text-sm font-medium">Arquitetura pronta para integração</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(226,232,240,0.74)]">Consuma serviços e conecte rotinas próprias sem perder o contexto técnico do problema.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-2 text-[rgba(125,211,252,0.92)]">
                <ShieldCheck className="size-4" />
              </div>
              <p className="text-sm font-medium">Escalabilidade para diferentes cenários</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(226,232,240,0.74)]">A mesma base pode atender uso direto, integração com sistemas e automações de apoio.</p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/18 bg-white/8 text-white hover:bg-white/12 hover:text-white"
          >
            <Link href="/dashboard/portico-espacial">
              Ver modulo estrutural 3D
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </article>

      <article className="rounded-[1.9rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,249,0.84))] p-6 shadow-[0_34px_75px_-56px_rgba(15,23,42,0.45)]">
        <div className="space-y-5">
          <div className="inline-flex rounded-full border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(22,101,52)]">
            Biblioteca técnica
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[rgb(15,23,42)]">
              Consulte normas e referências técnicas ao longo do desenvolvimento do projeto.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[rgb(71,85,105)]">
              Centralize o apoio normativo e a navegação por conteúdos técnicos sem precisar interromper a análise.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Consulta de normas',
                description: 'Acesso estruturado a conteúdo técnico durante o processo de decisão.',
                icon: BookOpen,
              },
              {
                title: 'Biblioteca organizada',
                description: 'Cards, filtros e acessos rápidos com linguagem visual mais consistente.',
                icon: Library,
              },
            ].map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="flex gap-4 rounded-[1.4rem] border border-[rgba(148,163,184,0.2)] bg-white/76 p-4"
              >
                <div className="inline-flex h-fit rounded-2xl bg-[rgba(22,163,74,0.1)] p-2 text-[rgb(22,101,52)]">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[rgb(15,23,42)]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            asChild
            variant="outline"
            className="rounded-full border-[rgba(15,23,42,0.12)] bg-white/75 text-[rgb(15,23,42)] hover:bg-white"
          >
            <Link href="/dashboard/normas">
              Abrir biblioteca de normas
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </article>
    </section>
  );
}
