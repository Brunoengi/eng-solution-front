'use client';

import { useState } from 'react';
import { CompactSelectInputsGrid, type CompactSelectInputGridItem } from '@/components/user/molecules/compact-select-inputs-grid';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function CompactSelectInputsGridDemo() {
  const [materials, setMaterials] = useState<Record<string, string | number>>({
    type: 'steel',
    grade: 'A36',
    finish: 'polished',
    coating: 'zinc',
    treatment: 'annealed',
    quality: 'premium',
  });

  const [loadTypes, setLoadTypes] = useState<Record<string, string | number>>({
    loadCase1: 'axial',
    loadCase2: 'bending',
    loadCase3: 'torsion',
    loadCase4: 'shear',
    boundary1: 'fixed',
    boundary2: 'pinned',
    boundary3: 'roller',
    boundary4: 'free',
  });

  const [analysisSettings, setAnalysisSettings] = useState<Record<string, string | number>>({
    meshQuality: 'fine',
    solver: 'direct',
    convergence: 'tight',
    method: 'linear',
  });

  const handleMaterialChange = (id: string, value: string | number) => {
    setMaterials((prev) => ({ ...prev, [id]: value }));
  };

  const handleLoadTypeChange = (id: string, value: string | number) => {
    setLoadTypes((prev) => ({ ...prev, [id]: value }));
  };

  const handleAnalysisChange = (id: string, value: string | number) => {
    setAnalysisSettings((prev) => ({ ...prev, [id]: value }));
  };

  // Exemplo 1: Materiais (2 colunas)
  const materialInputs: CompactSelectInputGridItem[] = [
    {
      id: 'type',
      label: 'Tipo',
      value: materials.type,
      options: [
        { label: 'Aço', value: 'steel' },
        { label: 'Alumínio', value: 'aluminum' },
        { label: 'Cobre', value: 'copper' },
        { label: 'Titânio', value: 'titanium' },
      ],
    },
    {
      id: 'grade',
      label: 'Grau',
      value: materials.grade,
      options: [
        { label: 'A36', value: 'A36' },
        { label: 'A572', value: 'A572' },
        { label: 'A992', value: 'A992' },
        { label: '304SS', value: '304SS' },
      ],
    },
    {
      id: 'finish',
      label: 'Acabamento',
      value: materials.finish,
      options: [
        { label: 'Polido', value: 'polished' },
        { label: 'Fosco', value: 'matte' },
        { label: 'Escovado', value: 'brushed' },
        { label: 'Natural', value: 'natural' },
      ],
    },
    {
      id: 'coating',
      label: 'Revestimento',
      value: materials.coating,
      options: [
        { label: 'Zinco', value: 'zinc' },
        { label: 'Níquel', value: 'nickel' },
        { label: 'Cromo', value: 'chrome' },
        { label: 'Sem', value: 'none' },
      ],
    },
    {
      id: 'treatment',
      label: 'Tratamento',
      value: materials.treatment,
      options: [
        { label: 'Recozido', value: 'annealed' },
        { label: 'Temperado', value: 'tempered' },
        { label: 'Normalizado', value: 'normalized' },
        { label: 'Como laminado', value: 'as-rolled' },
      ],
    },
    {
      id: 'quality',
      label: 'Qualidade',
      value: materials.quality,
      options: [
        { label: 'Premium', value: 'premium' },
        { label: 'Padrão', value: 'standard' },
        { label: 'Econômica', value: 'economy' },
      ],
    },
  ];

  // Exemplo 2: Tipos de Carga e Condições de Contorno (4 colunas)
  const loadTypeInputs: CompactSelectInputGridItem[] = [
    {
      id: 'loadCase1',
      label: 'Caso 1',
      value: loadTypes.loadCase1,
      options: [
        { label: 'Axial', value: 'axial' },
        { label: 'Flexão', value: 'bending' },
        { label: 'Torção', value: 'torsion' },
        { label: 'Cisalhamento', value: 'shear' },
      ],
    },
    {
      id: 'loadCase2',
      label: 'Caso 2',
      value: loadTypes.loadCase2,
      options: [
        { label: 'Axial', value: 'axial' },
        { label: 'Flexão', value: 'bending' },
        { label: 'Torção', value: 'torsion' },
        { label: 'Cisalhamento', value: 'shear' },
      ],
    },
    {
      id: 'loadCase3',
      label: 'Caso 3',
      value: loadTypes.loadCase3,
      options: [
        { label: 'Axial', value: 'axial' },
        { label: 'Flexão', value: 'bending' },
        { label: 'Torção', value: 'torsion' },
        { label: 'Cisalhamento', value: 'shear' },
      ],
    },
    {
      id: 'loadCase4',
      label: 'Caso 4',
      value: loadTypes.loadCase4,
      options: [
        { label: 'Axial', value: 'axial' },
        { label: 'Flexão', value: 'bending' },
        { label: 'Torção', value: 'torsion' },
        { label: 'Cisalhamento', value: 'shear' },
      ],
    },
    {
      id: 'boundary1',
      label: 'BC 1',
      value: loadTypes.boundary1,
      options: [
        { label: 'Fixo', value: 'fixed' },
        { label: 'Pinado', value: 'pinned' },
        { label: 'Apoio', value: 'roller' },
        { label: 'Livre', value: 'free' },
      ],
    },
    {
      id: 'boundary2',
      label: 'BC 2',
      value: loadTypes.boundary2,
      options: [
        { label: 'Fixo', value: 'fixed' },
        { label: 'Pinado', value: 'pinned' },
        { label: 'Apoio', value: 'roller' },
        { label: 'Livre', value: 'free' },
      ],
    },
    {
      id: 'boundary3',
      label: 'BC 3',
      value: loadTypes.boundary3,
      options: [
        { label: 'Fixo', value: 'fixed' },
        { label: 'Pinado', value: 'pinned' },
        { label: 'Apoio', value: 'roller' },
        { label: 'Livre', value: 'free' },
      ],
    },
    {
      id: 'boundary4',
      label: 'BC 4',
      value: loadTypes.boundary4,
      options: [
        { label: 'Fixo', value: 'fixed' },
        { label: 'Pinado', value: 'pinned' },
        { label: 'Apoio', value: 'roller' },
        { label: 'Livre', value: 'free' },
      ],
    },
  ];

  // Exemplo 3: Configurações de Análise (2 colunas)
  const analysisInputs: CompactSelectInputGridItem[] = [
    {
      id: 'meshQuality',
      label: 'Malha',
      value: analysisSettings.meshQuality,
      options: [
        { label: 'Grosseira', value: 'coarse' },
        { label: 'Média', value: 'medium' },
        { label: 'Fina', value: 'fine' },
        { label: 'Muito Fina', value: 'very-fine' },
      ],
    },
    {
      id: 'solver',
      label: 'Solver',
      value: analysisSettings.solver,
      options: [
        { label: 'Direto', value: 'direct' },
        { label: 'Iterativo', value: 'iterative' },
        { label: 'FFT', value: 'fft' },
      ],
    },
    {
      id: 'convergence',
      label: 'Convergência',
      value: analysisSettings.convergence,
      options: [
        { label: 'Relaxada', value: 'loose' },
        { label: 'Normal', value: 'normal' },
        { label: 'Apertada', value: 'tight' },
      ],
    },
    {
      id: 'method',
      label: 'Método',
      value: analysisSettings.method,
      options: [
        { label: 'Linear', value: 'linear' },
        { label: 'Não-linear', value: 'nonlinear' },
        { label: 'Dinâmico', value: 'dynamic' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            CompactSelectInputsGrid Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Selects compactos com múltiplos campos por linha
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-4">
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={6} colsSm={12}>
              <CompactSelectInputsGrid
                title="Propriedades do Material (2 colunas)"
                unit="Material"
                inputs={materialInputs}
                onChange={handleMaterialChange}
                columnsPerRow={2}
              />
            </GridItem>

            <GridItem cols={12} colsMd={6} colsSm={12}>
              <CompactSelectInputsGrid
                title="Configurações de Análise (2 colunas)"
                unit="Config"
                inputs={analysisInputs}
                onChange={handleAnalysisChange}
                columnsPerRow={2}
              />
            </GridItem>
          </GridLayout>

          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <CompactSelectInputsGrid
                title="Cargas e Condições de Contorno (4 colunas)"
                unit="Tipo"
                inputs={loadTypeInputs}
                onChange={handleLoadTypeChange}
                columnsPerRow={4}
              />
            </GridItem>
          </GridLayout>

          {/* Exemplo com 3 colunas */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={8} colsSm={12}>
              <CompactSelectInputsGrid
                title="Propriedades do Material (3 colunas)"
                unit="Material"
                inputs={materialInputs}
                onChange={handleMaterialChange}
                columnsPerRow={3}
              />
            </GridItem>
          </GridLayout>

          {/* Exibição dos valores */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Materiais Selecionados
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(materials).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">{String(value)}</span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Cargas e Condições
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(loadTypes).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">{String(value)}</span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Configurações
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(analysisSettings).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">{String(value)}</span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>
          </GridLayout>

          {/* Exemplo com estado desabilitado */}
          <GridLayout className="mb-4">
            <GridItem cols={12} colsMd={6} colsSm={12}>
              <CompactSelectInputsGrid
                title="Estado Desabilitado (Demonstração)"
                unit="Config"
                inputs={analysisInputs}
                onChange={handleAnalysisChange}
                disabled={true}
                columnsPerRow={2}
              />
            </GridItem>

            <GridItem cols={12} colsMd={6} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Informações
                </h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Layout responsivo e flexível</li>
                  <li>✓ Suporte a múltiplas colunas</li>
                  <li>✓ Estado desabilitado</li>
                  <li>✓ Validação de erros</li>
                  <li>✓ Placeholders customizáveis</li>
                  <li>✓ Estilo consistente com number inputs</li>
                </ul>
              </div>
            </GridItem>
          </GridLayout>
        </GridContainer>
      </main>
    </div>
  );
}
