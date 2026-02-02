'use client';

import { useState } from 'react';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';
import { OneNumberInput } from '@/components/user/atoms/one-number-input';

export default function LayoutTest() {
  const [firstDivContent, setFirstDivContent] = useState('Painel Lateral');
  const [contentHeight, setContentHeight] = useState(400);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Layout Test</h1>
          <p className="text-sm text-muted-foreground">
            Primeira div com tamanho fixo, outras 3 ocupam espaço restante
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-6">
          {/* Controles */}
          <GridLayout className="mb-6">
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Controles
                </h2>

                <OneNumberInput
                  label="Altura do Container"
                  value={contentHeight}
                  onChange={(value) =>
                    setContentHeight(typeof value === 'string' ? 400 : value)
                  }
                  unit="px"
                  min={200}
                  max={800}
                  step={50}
                />
              </div>
            </GridItem>
          </GridLayout>

          {/* Layout Test */}
          <GridLayout>
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Layout: Sidebar + 3 Colunas
                </h2>

                {/* Container Flex Principal */}
                <div
                  className="flex gap-4"
                  style={{ height: `${contentHeight}px` }}
                >
                  {/* Primeira Div - Tamanho do Conteúdo */}
                  <div className="flex-shrink-0 rounded-lg border border-border bg-muted p-4">
                    <div className="w-48">
                      <h3 className="mb-3 font-semibold text-foreground">
                        {firstDivContent}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Menu Item 1</p>
                        <p>Menu Item 2</p>
                        <p>Menu Item 3</p>
                        <p>Menu Item 4</p>
                        <p>Menu Item 5</p>
                      </div>
                    </div>
                  </div>

                  {/* Três Divs que Ocupam Espaço Restante */}
                  <div className="flex flex-1 gap-4">
                    {/* Coluna 1 */}
                    <div className="flex-1 rounded-lg border border-border bg-primary/5 p-4">
                      <h3 className="mb-3 font-semibold text-foreground">
                        Coluna 1
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ocupa 1/3 do espaço restante
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="h-12 rounded bg-primary/10" />
                        <div className="h-12 rounded bg-primary/10" />
                        <div className="h-12 rounded bg-primary/10" />
                      </div>
                    </div>

                    {/* Coluna 2 */}
                    <div className="flex-1 rounded-lg border border-border bg-secondary/5 p-4">
                      <h3 className="mb-3 font-semibold text-foreground">
                        Coluna 2
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ocupa 1/3 do espaço restante
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="h-12 rounded bg-secondary/10" />
                        <div className="h-12 rounded bg-secondary/10" />
                        <div className="h-12 rounded bg-secondary/10" />
                      </div>
                    </div>

                    {/* Coluna 3 */}
                    <div className="flex-1 rounded-lg border border-border bg-accent/5 p-4">
                      <h3 className="mb-3 font-semibold text-foreground">
                        Coluna 3
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ocupa 1/3 do espaço restante
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="h-12 rounded bg-accent/10" />
                        <div className="h-12 rounded bg-accent/10" />
                        <div className="h-12 rounded bg-accent/10" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações */}
                <div className="mt-6 space-y-2 rounded-md bg-muted p-4 text-xs">
                  <p className="font-semibold text-foreground">Estrutura CSS:</p>
                  <pre className="overflow-x-auto text-muted-foreground">
{`<div className="flex gap-4" style={{ height: '${contentHeight}px' }}>
  {/* flex-shrink-0: não encolhe, mantém tamanho */}
  <div className="flex-shrink-0">
    Sidebar (w-48)
  </div>

  {/* flex-1: divide o espaço restante */}
  <div className="flex flex-1 gap-4">
    <div className="flex-1">Coluna 1</div>
    <div className="flex-1">Coluna 2</div>
    <div className="flex-1">Coluna 3</div>
  </div>
</div>`}
                  </pre>
                </div>
              </div>
            </GridItem>
          </GridLayout>
        </GridContainer>
      </main>
    </div>
  );
}
