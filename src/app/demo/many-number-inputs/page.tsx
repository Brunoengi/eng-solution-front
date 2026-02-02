'use client';

import { useState } from 'react';
import { ManyNumberInputs, type NumberInputItem } from '@/components/user/molecules/many-number-inputs';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function ManyNumberInputsDemo() {
  const [dimensions, setDimensions] = useState<Record<string, number | string>>({
    width: 100,
    height: 50,
    depth: 30,
  });

  const [forces, setForces] = useState<Record<string, number | string>>({
    forceX: 500,
    forceY: 300,
    forceZ: 200,
  });

  const [strains, setStrains] = useState<Record<string, number | string>>({
    strainX: '',
    strainY: '',
    strainZ: '',
  });

  const handleDimensionChange = (id: string, value: number | string) => {
    setDimensions((prev) => ({ ...prev, [id]: value }));
  };

  const handleForceChange = (id: string, value: number | string) => {
    setForces((prev) => ({ ...prev, [id]: value }));
  };

  const handleStrainChange = (id: string, value: number | string) => {
    setStrains((prev) => ({ ...prev, [id]: value }));
  };

  // Exemplo 1: Dimensões
  const dimensionInputs: NumberInputItem[] = [
    { id: 'width', label: 'Largura', value: dimensions.width, min: 0, step: 1 },
    { id: 'height', label: 'Altura', value: dimensions.height, min: 0, step: 1 },
    { id: 'depth', label: 'Profundidade', value: dimensions.depth, min: 0, step: 1 },
  ];

  // Exemplo 2: Forças (grid com 3 colunas)
  const forceInputs: NumberInputItem[] = [
    { id: 'forceX', label: 'Fx', value: forces.forceX, min: 0, step: 10 },
    { id: 'forceY', label: 'Fy', value: forces.forceY, min: 0, step: 10 },
    { id: 'forceZ', label: 'Fz', value: forces.forceZ, min: 0, step: 10 },
  ];

  // Exemplo 3: Deformações (grid com 3 colunas)
  const strainInputs: NumberInputItem[] = [
    {
      id: 'strainX',
      label: 'εₓ (Epsilon X)',
      value: strains.strainX,
      placeholder: '0.0',
      step: 0.001,
    },
    {
      id: 'strainY',
      label: 'εᵧ (Epsilon Y)',
      value: strains.strainY,
      placeholder: '0.0',
      step: 0.001,
    },
    {
      id: 'strainZ',
      label: 'εᵤ (Epsilon Z)',
      value: strains.strainZ,
      placeholder: '0.0',
      step: 0.001,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            ManyNumberInputs Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Múltiplos inputs com uma única unidade compartilhada
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-6">
          <GridLayout className="mb-6">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <ManyNumberInputs
                  title="Dimensões"
                  unit="mm"
                  inputs={dimensionInputs}
                  onChange={handleDimensionChange}
                  gridCols={1}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <ManyNumberInputs
                  title="Forças Aplicadas"
                  unit="N (Newton)"
                  inputs={forceInputs}
                  onChange={handleForceChange}
                  gridCols={3}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <ManyNumberInputs
                  title="Deformações"
                  unit="mm/mm"
                  inputs={strainInputs}
                  onChange={handleStrainChange}
                  gridCols={3}
                />
              </div>
            </GridItem>
          </GridLayout>

          {/* Exibição dos valores */}
          <GridLayout>
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Dimensões (mm)
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(dimensions).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : value} mm
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Forças (N)
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(forces).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : value} N
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Deformações (mm/mm)
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(strains).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : value} mm/mm
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>
          </GridLayout>

          {/* Documentação */}
          <GridLayout>
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Uso do Componente
                </h2>
                <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
{`<ManyNumberInputs
  title="Dimensões"
  unit="mm"
  inputs={[
    { id: 'width', label: 'Largura', value: 100 },
    { id: 'height', label: 'Altura', value: 50 },
    { id: 'depth', label: 'Profundidade', value: 30 },
  ]}
  onChange={(id, value) => {
    // Atualizar estado
  }}
  gridCols={1}  // Número de colunas no grid
/>`}
                </pre>
              </div>
            </GridItem>
          </GridLayout>
        </GridContainer>
      </main>
    </div>
  );
}
