'use client';

import { useState } from 'react';
import { ManySelectInputs, type SelectInputItem } from '@/components/user/molecules/many-select-inputs';
import { type SelectOption } from '@/components/user/atoms/oneSelectInput';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function ManySelectInputsDemo() {
  const [materials, setMaterials] = useState<Record<string, string | number>>({
    frameType: 'steel',
    panelType: 'concrete',
    sealType: 'rubber',
  });

  const [conditions, setConditions] = useState<Record<string, string | number>>({
    temperatureRange: 'moderate',
    humidityLevel: 'normal',
    exposureType: 'indoor',
  });

  const [properties, setProperties] = useState<Record<string, string | number>>({
    elasticity: '',
    plasticity: '',
    ductility: '',
  });

  const handleMaterialChange = (id: string, value: string | number) => {
    setMaterials((prev) => ({ ...prev, [id]: value }));
  };

  const handleConditionChange = (id: string, value: string | number) => {
    setConditions((prev) => ({ ...prev, [id]: value }));
  };

  const handlePropertyChange = (id: string, value: string | number) => {
    setProperties((prev) => ({ ...prev, [id]: value }));
  };

  // Exemplo 1: Tipos de Materiais
  const materialOptions: SelectOption[] = [
    { label: 'Aço', value: 'steel' },
    { label: 'Concreto', value: 'concrete' },
    { label: 'Madeira', value: 'wood' },
    { label: 'Alumínio', value: 'aluminum' },
    { label: 'Vidro', value: 'glass' },
  ];

  const panelOptions: SelectOption[] = [
    { label: 'Concreto Armado', value: 'concrete' },
    { label: 'Concreto Protendido', value: 'prestressed' },
    { label: 'Concreto Leve', value: 'lightweight' },
    { label: 'Concreto Reforçado', value: 'reinforced' },
  ];

  const sealOptions: SelectOption[] = [
    { label: 'Borracha', value: 'rubber' },
    { label: 'Neoprene', value: 'neoprene' },
    { label: 'Silicone', value: 'silicone' },
    { label: 'Poliuretano', value: 'polyurethane' },
  ];

  const materialInputs: SelectInputItem[] = [
    {
      id: 'frameType',
      label: 'Tipo de Estrutura',
      value: materials.frameType,
      options: materialOptions,
      placeholder: 'Selecione material',
    },
    {
      id: 'panelType',
      label: 'Tipo de Painel',
      value: materials.panelType,
      options: panelOptions,
      placeholder: 'Selecione painel',
    },
    {
      id: 'sealType',
      label: 'Tipo de Vedação',
      value: materials.sealType,
      options: sealOptions,
      placeholder: 'Selecione vedação',
    },
  ];

  // Exemplo 2: Condições Ambientais
  const temperatureOptions: SelectOption[] = [
    { label: 'Muito Frio (< 0°C)', value: 'very_cold' },
    { label: 'Frio (0-10°C)', value: 'cold' },
    { label: 'Moderado (10-20°C)', value: 'moderate' },
    { label: 'Quente (20-30°C)', value: 'hot' },
    { label: 'Muito Quente (> 30°C)', value: 'very_hot' },
  ];

  const humidityOptions: SelectOption[] = [
    { label: 'Seco (< 40%)', value: 'dry' },
    { label: 'Normal (40-60%)', value: 'normal' },
    { label: 'Úmido (60-80%)', value: 'humid' },
    { label: 'Muito Úmido (> 80%)', value: 'very_humid' },
  ];

  const exposureOptions: SelectOption[] = [
    { label: 'Interior', value: 'indoor' },
    { label: 'Exterior Protegido', value: 'sheltered' },
    { label: 'Exterior Exposto', value: 'exposed' },
    { label: 'Marítimo', value: 'maritime' },
  ];

  const conditionInputs: SelectInputItem[] = [
    {
      id: 'temperatureRange',
      label: 'Faixa de Temperatura',
      value: conditions.temperatureRange,
      options: temperatureOptions,
    },
    {
      id: 'humidityLevel',
      label: 'Nível de Umidade',
      value: conditions.humidityLevel,
      options: humidityOptions,
    },
    {
      id: 'exposureType',
      label: 'Tipo de Exposição',
      value: conditions.exposureType,
      options: exposureOptions,
    },
  ];

  // Exemplo 3: Propriedades (com letras gregas)
  const elasticityOptions: SelectOption[] = [
    { label: 'Baixa Elasticidade', value: 'low' },
    { label: 'Média Elasticidade', value: 'medium' },
    { label: 'Alta Elasticidade', value: 'high' },
  ];

  const plasticityOptions: SelectOption[] = [
    { label: 'Baixa Plasticidade', value: 'low' },
    { label: 'Média Plasticidade', value: 'medium' },
    { label: 'Alta Plasticidade', value: 'high' },
  ];

  const ductilityOptions: SelectOption[] = [
    { label: 'Frágil', value: 'brittle' },
    { label: 'Semi-dúctil', value: 'semi_ductile' },
    { label: 'Dúctil', value: 'ductile' },
    { label: 'Muito Dúctil', value: 'highly_ductile' },
  ];

  const propertyInputs: SelectInputItem[] = [
    {
      id: 'elasticity',
      label: 'Elasticidade (λ)',
      value: properties.elasticity,
      options: elasticityOptions,
      placeholder: 'Selecione',
    },
    {
      id: 'plasticity',
      label: 'Plasticidade (μ)',
      value: properties.plasticity,
      options: plasticityOptions,
      placeholder: 'Selecione',
    },
    {
      id: 'ductility',
      label: 'Ductilidade (δ)',
      value: properties.ductility,
      options: ductilityOptions,
      placeholder: 'Selecione',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            ManySelectInputs Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Múltiplos selects com uma única unidade compartilhada
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-6">
          <GridLayout className="mb-6">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <ManySelectInputs
                  title="Materiais"
                  unit="tipo"
                  inputs={materialInputs}
                  onChange={handleMaterialChange}
                  gridCols={1}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <ManySelectInputs
                  title="Condições Ambientais"
                  unit="ambiente"
                  inputs={conditionInputs}
                  onChange={handleConditionChange}
                  gridCols={1}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <ManySelectInputs
                  title="Propriedades Mecânicas"
                  unit="nível"
                  inputs={propertyInputs}
                  onChange={handlePropertyChange}
                  gridCols={1}
                />
              </div>
            </GridItem>
          </GridLayout>

          {/* Exibição dos valores */}
          <GridLayout>
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Materiais
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(materials).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : String(value)}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Condições
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(conditions).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : String(value)}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Propriedades
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(properties).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : String(value)}
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
{`<ManySelectInputs
  title="Materiais"
  unit="tipo"
  inputs={[
    {
      id: 'frameType',
      label: 'Tipo de Estrutura',
      value: 'steel',
      options: [
        { label: 'Aço', value: 'steel' },
        { label: 'Concreto', value: 'concrete' },
        ...
      ],
      placeholder: 'Selecione material',
    },
    ...
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
