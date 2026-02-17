'use client';

import { useState } from 'react';
import { CompactNumberInputs, type CompactNumberInputItem } from '@/components/user/molecules/compact-number-inputs';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function CompactNumberInputsDemo() {
  const [dimensions, setDimensions] = useState<Record<string, number | string>>({
    width: 100,
    height: 50,
    depth: 30,
    thickness: 5,
  });

  const [forces, setForces] = useState<Record<string, number | string>>({
    forceX: 500,
    forceY: 300,
    forceZ: 200,
    torque: 150,
  });

  const [materialProps, setMaterialProps] = useState<Record<string, number | string>>({
    elasticity: 210,
    poisson: 0.3,
    density: 7.85,
    yield: 250,
  });

  const handleDimensionChange = (id: string, value: number | string) => {
    setDimensions((prev) => ({ ...prev, [id]: value }));
  };

  const handleForceChange = (id: string, value: number | string) => {
    setForces((prev) => ({ ...prev, [id]: value }));
  };

  const handleMaterialPropsChange = (id: string, value: number | string) => {
    setMaterialProps((prev) => ({ ...prev, [id]: value }));
  };

  // Exemplo 1: Dimensões
  const dimensionInputs: CompactNumberInputItem[] = [
    { id: 'width', label: 'Largura', value: dimensions.width, min: 0, step: 1 },
    { id: 'height', label: 'Altura', value: dimensions.height, min: 0, step: 1 },
    { id: 'depth', label: 'Profundidade', value: dimensions.depth, min: 0, step: 1 },
    { id: 'thickness', label: 'Espessura', value: dimensions.thickness, min: 0, step: 0.5 },
  ];

  // Exemplo 2: Forças
  const forceInputs: CompactNumberInputItem[] = [
    { id: 'forceX', label: 'Fx', value: forces.forceX, min: 0, step: 10 },
    { id: 'forceY', label: 'Fy', value: forces.forceY, min: 0, step: 10 },
    { id: 'forceZ', label: 'Fz', value: forces.forceZ, min: 0, step: 10 },
    { id: 'torque', label: 'Torque', value: forces.torque, min: 0, step: 5 },
  ];

  // Exemplo 3: Propriedades do Material
  const materialInputs: CompactNumberInputItem[] = [
    { id: 'elasticity', label: 'Módulo E', value: materialProps.elasticity, min: 0, step: 10 },
    { id: 'poisson', label: 'ν (Poisson)', value: materialProps.poisson, min: 0, max: 0.5, step: 0.01 },
    { id: 'density', label: 'Densidade', value: materialProps.density, min: 0, step: 0.1 },
    { id: 'yield', label: 'σy', value: materialProps.yield, min: 0, step: 10 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            CompactNumberInputs Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Inputs numéricos compactos para economizar espaço vertical
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-4">
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <CompactNumberInputs
                title="Dimensões"
                unit="mm"
                inputs={dimensionInputs}
                onChange={handleDimensionChange}
              />
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <CompactNumberInputs
                title="Forças Aplicadas"
                unit="N"
                inputs={forceInputs}
                onChange={handleForceChange}
              />
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <CompactNumberInputs
                title="Material"
                unit="GPa"
                inputs={materialInputs}
                onChange={handleMaterialPropsChange}
              />
            </GridItem>
          </GridLayout>

          {/* Exibição dos valores */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
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
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
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
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Propriedades do Material
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(materialProps).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : value}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>
          </GridLayout>

          {/* Comparação de Tamanhos */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Comparação: ManyNumberInputs vs CompactNumberInputs
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>CompactNumberInputs</strong>: Economiza espaço vertical, ideal para sidebars ou painéis pequenos</li>
                    <li><strong>ManyNumberInputs</strong>: Melhor para layouts principais com mais espaço disponível</li>
                    <li><strong>Estilo unificado</strong>: CompactNumberInputs agrupa todos os inputs em um único container com bordas compartilhadas</li>
                    <li><strong>Menor espaçamento</strong>: Altura reduzida dos controles (h-7 vs h-9) e gaps mínimos</li>
                  </ul>
                </div>
              </div>
            </GridItem>
          </GridLayout>

          {/* Documentação */}
          <GridLayout>
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Uso do Componente
                </h2>
                <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
{`<CompactNumberInputs
  title="Dimensões"
  unit="mm"
  inputs={[
    { id: 'width', label: 'Largura', value: 100, min: 0, step: 1 },
    { id: 'height', label: 'Altura', value: 50, min: 0, step: 1 },
    { id: 'depth', label: 'Profundidade', value: 30, min: 0, step: 1 },
  ]}
  onChange={(id, value) => {
    // Atualizar estado
  }}
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
