import { Header } from '../components/user/layout/header';
import { GridContainer } from '../components/user/layout/grid-layout';
import { Button } from '@/components/ui/button';
import { HeroBeamMoment } from '@/components/user/molecules/hero-beam-moment';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <GridContainer className="py-12">
          <section className="mb-10 rounded-xl border border-border bg-card/50 p-4 md:p-6">
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Engenharia Estrutural</p>
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                  Diagrama de momento fletor para viga contínua com balanço
                </h1>
                <p className="mt-3 text-base text-muted-foreground">
                  Visualização técnica da envoltória de momentos para apoiar análise e dimensionamento estrutural.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <Button asChild>
                    <a href="/dashboard/geometria">Abrir módulo de Geometria</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/dashboard/viga-concreto-armado">Explorar Dimensionamento</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/dashboard/normas/nbr6118/tabelas">Tabelas NBR 6118</a>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background/80 p-2 lg:col-span-3">
                <HeroBeamMoment />
              </div>
            </div>
          </section>
        </GridContainer>
      </main>
    </div>
  );
}
