import Link from 'next/link';
import { ArrowRight, BookOpen, DraftingCompass } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function HomeFinalCta() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden rounded-[2rem] border border-[rgba(15,23,42,0.1)] bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] px-6 py-8 text-white shadow-[0_36px_80px_-54px_rgba(15,23,42,0.92)] md:px-8 md:py-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.24),transparent_32%)]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(191,219,254,0.9)]">
            Próximo passo
          </span>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Comece pelo módulo que melhor se encaixa na sua etapa de trabalho.
          </h2>
          <p className="text-base leading-7 text-[rgba(226,232,240,0.82)]">
            Abra a geometria para iniciar a modelagem ou consulte a biblioteca de normas para apoiar suas verificações
            e decisões de projeto.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white px-6 text-[rgb(15,23,42)] hover:bg-[rgba(255,255,255,0.92)]"
          >
            <Link href="/dashboard/geometria">
              <DraftingCompass />
              Começar pela geometria
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white"
          >
            <Link href="/dashboard/normas">
              <BookOpen />
              Consultar normas
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
