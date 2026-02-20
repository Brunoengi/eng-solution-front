import { Header } from '../components/user/layout/header';
import { GridContainer, GridLayout, GridItem } from '../components/user/layout/grid-layout';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <GridContainer className="py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              Bem-vindo ao Eng Solution
            </h1>
            <p className="text-lg text-muted-foreground">
              Sua plataforma de soluções de engenharia
            </p>
            <Button className="mt-4">Calcular esforços solicitantes</Button>
          </div>

          <GridLayout>
            <GridItem cols={12} colsMd={6} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-xl font-semibold text-card-foreground">
                  Card 1
                </h2>
                <p className="text-sm text-muted-foreground">
                  Este é um exemplo de item em um grid de 12 colunas. Ocupa 6 colunas em telas médias e 12 em telas pequenas.
                </p>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={6} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-xl font-semibold text-card-foreground">
                  Card 2
                </h2>
                <p className="text-sm text-muted-foreground">
                  Layout responsivo e reutilizável em todas as páginas do projeto.
                </p>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-xl font-semibold text-card-foreground">
                  Card 3
                </h2>
                <p className="text-sm text-muted-foreground">
                  4 colunas em telas médias
                </p>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-xl font-semibold text-card-foreground">
                  Card 4
                </h2>
                <p className="text-sm text-muted-foreground">
                  4 colunas em telas médias
                </p>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-xl font-semibold text-card-foreground">
                  Card 5
                </h2>
                <p className="text-sm text-muted-foreground">
                  4 colunas em telas médias
                </p>
              </div>
            </GridItem>
          </GridLayout>
        </GridContainer>
      </main>
    </div>
  );
}
