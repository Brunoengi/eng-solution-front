'use client';

import { useState } from 'react';
import { CompactNumberInputsGrid, type CompactNumberInputGridItem } from '@/components/user/molecules/compact-number-inputs-grid';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function CompactNumberInputsGridDemo() {
  const [dimensions, setDimensions] = useState<Record<string, number | string>>({
    width: 100,
    height: 50,
    depth: 30,
    thickness: 5,
    length: 200,
    radius: 25,
  });

  const [forces, setForces] = useState<Record<string, number | string>>({
    forceX: 500,
    forceY: 300,
    forceZ: 200,
    torqueX: 150,
    torqueY: 120,
    torqueZ: 80,
    pressure: 10,
    temperature: 25,
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

  // Exemplo 1: Dimensões (2 colunas)
  const dimensionInputs: CompactNumberInputGridItem[] = [
    { id: 'width', label: 'Largura', value: dimensions.width, min: 0, step: 1 },
    { id: 'height', label: 'Altura', value: dimensions.height, min: 0, step: 1 },
    { id: 'depth', label: 'Profundidade', value: dimensions.depth, min: 0, step: 1 },
    { id: 'thickness', label: 'Espessura', value: dimensions.thickness, min: 0, step: 0.5 },
    { id: 'length', label: 'Comprimento', value: dimensions.length, min: 0, step: 1 },
    { id: 'radius', label: 'Raio', value: dimensions.radius, min: 0, step: 1 },
  ];

  // Exemplo 2: Forças (4 colunas para demonstrar flexibilidade)
  const forceInputs: CompactNumberInputGridItem[] = [
    { id: 'forceX', label: 'Fx', value: forces.forceX, min: 0, step: 10 },
    { id: 'forceY', label: 'Fy', value: forces.forceY, min: 0, step: 10 },
    { id: 'forceZ', label: 'Fz', value: forces.forceZ, min: 0, step: 10 },
    { id: 'torqueX', label: 'Tx', value: forces.torqueX, min: 0, step: 5 },
    { id: 'torqueY', label: 'Ty', value: forces.torqueY, min: 0, step: 5 },
    { id: 'torqueZ', label: 'Tz', value: forces.torqueZ, min: 0, step: 5 },
    { id: 'pressure', label: 'Pressão', value: forces.pressure, min: 0, step: 1 },
    { id: 'temperature', label: 'Temp.', value: forces.temperature, step: 1 },
  ];

  // Exemplo 3: Propriedades do Material (2 colunas)
  const materialInputs: CompactNumberInputGridItem[] = [
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
            CompactNumberInputsGrid Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Inputs numéricos compactos com múltiplos campos por linha
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-4">
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={6} colsSm={12}>
              <CompactNumberInputsGrid
                title="Dimensões (2 colunas)"
                unit="mm"
                inputs={dimensionInputs}
                onChange={handleDimensionChange}
                columnsPerRow={2}
              />
            </GridItem>

            <GridItem cols={12} colsMd={6} colsSm={12}>
              <CompactNumberInputsGrid
                title="Propriedades do Material (2 colunas)"
                unit="GPa"
                inputs={materialInputs}
                onChange={handleMaterialPropsChange}
                columnsPerRow={2}
              />
            </GridItem>
          </GridLayout>

          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <CompactNumberInputsGrid
                title="Forças e Condições (4 colunas)"
                unit="N"
                inputs={forceInputs}
                onChange={handleForceChange}
                columnsPerRow={4}
              />
            </GridItem>
          </GridLayout>

          {/* Exemplo com 3 colunas */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={8} colsSm={12}>
              <CompactNumberInputsGrid
                title="Dimensões (3 colunas)"
                unit="mm"
                inputs={dimensionInputs}
                onChange={handleDimensionChange}
                columnsPerRow={3}
              />
            </GridItem>
          </GridLayout>

          {/* Exibição dos valores */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Dimensões
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
                  Forças e Condições
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(forces).map(([key, value]) => (
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

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Material
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

          {/* Documentação */}
          <GridLayout>
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Uso do Componente
                </h2>
                <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-muted-foreground">
{`<CompactNumberInputsGrid
  title="Dimensões"
  unit="mm"
  inputs={[
    { id: 'width', label: 'Largura', value: 100, min: 0, step: 1 },
    { id: 'height', label: 'Altura', value: 50, min: 0, step: 1 },
    { id: 'depth', label: 'Profundidade', value: 30, min: 0, step: 1 },
    { id: 'thickness', label: 'Espessura', value: 5, min: 0, step: 0.5 },
  ]}
  onChange={(id, value) => {
    // Atualizar estado
  }}
  columnsPerRow={2}  // Número de inputs por linha (padrão: 2)
/>`}
                </pre>
                <div className="mt-4 prose prose-sm max-w-none text-muted-foreground">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Características:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>columnsPerRow</strong>: Define quantos inputs aparecem por linha (padrão: 2)</li>
                    <li><strong>Responsivo</strong>: Os inputs se ajustam automaticamente ao espaço disponível</li>
                    <li><strong>Linhas incompletas</strong>: Células vazias são preenchidas automaticamente para manter o alinhamento</li>
                    <li><strong>Layout em coluna</strong>: Label acima do input para economizar espaço horizontal</li>
                  </ul>
                </div>
              </div>
            </GridItem>
          </GridLayout>
        </GridContainer>
      </main>
    </div>
  );
}
