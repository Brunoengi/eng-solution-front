'use client';

import { useState } from 'react';
import { Inputs, type InputField } from '@/components/user/molecules/inputs';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function InputsDemo() {
  const [values, setValues] = useState<Record<string, number | string>>({
    height: 180,
    weight: 75,
    material: 'concrete',
    temperature: '',
    diameter: '',
    greekSymbol: '',
  });

  const handleFieldChange = (fieldId: string, value: number | string) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Exemplo 1: Mix de inputs simples
  const basicFields: InputField[] = [
    {
      type: 'number',
      id: 'height',
      label: 'Altura',
      value: values.height,
      unit: 'cm',
      placeholder: '0',
      min: 0,
      max: 300,
    },
    {
      type: 'number',
      id: 'weight',
      label: 'Peso',
      value: values.weight,
      unit: 'kg',
      placeholder: '0',
      min: 0,
      max: 500,
    },
  ];

  // Exemplo 2: Mix de diferentes tipos
  const mixedFields: InputField[] = [
    {
      type: 'number',
      id: 'diameter',
      label: 'Diâmetro',
      value: values.diameter,
      unit: 'mm',
      placeholder: '0',
      min: 0,
      step: 0.1,
    },
    {
      type: 'select',
      id: 'material',
      label: 'Material',
      value: values.material,
      options: [
        { label: 'Concreto', value: 'concrete' },
        { label: 'Aço', value: 'steel' },
        { label: 'Madeira', value: 'wood' },
        { label: 'Alumínio', value: 'aluminum' },
      ],
      unit: 'tipo',
    },
    {
      type: 'select',
      id: 'temperature',
      label: 'Temperatura',
      value: values.temperature,
      options: [
        { label: 'Frio (< 10°C)', value: 'cold' },
        { label: 'Moderado (10-20°C)', value: 'moderate' },
        { label: 'Quente (> 20°C)', value: 'hot' },
      ],
      unit: '°C',
      placeholder: 'Escolha uma temperatura',
    },
  ];

  // Exemplo 3: Com letras gregas
  const advancedFields: InputField[] = [
    {
      type: 'number',
      id: 'resistance',
      label: 'Resistência',
      value: values.diameter,
      unit: 'MPa',
      placeholder: '0',
      min: 0,
      step: 0.5,
    },
    {
      type: 'select',
      id: 'greekSymbol',
      label: 'Símbolo (α, β, γ...)',
      value: values.greekSymbol,
      options: [
        { label: 'α (alfa)', value: 'alpha' },
        { label: 'β (beta)', value: 'beta' },
        { label: 'γ (gama)', value: 'gamma' },
        { label: 'δ (delta)', value: 'delta' },
        { label: 'λ (lambda)', value: 'lambda' },
        { label: 'μ (mi)', value: 'mu' },
        { label: 'π (pi)', value: 'pi' },
        { label: 'σ (sigma)', value: 'sigma' },
      ],
      unit: 'símbolo',
      placeholder: 'Escolha um símbolo',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Inputs Demo</h1>
          <p className="text-sm text-muted-foreground">
            Componente que aceita tanto OneNumberInput quanto OneSelectInput
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-6">
          <GridLayout className="mb-6">
            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                  Exemplo 1: Número
                </h2>
                <Inputs
                  fields={basicFields}
                  onChange={handleFieldChange}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                  Exemplo 2: Mix (Number + Select)
                </h2>
                <Inputs
                  fields={mixedFields}
                  onChange={handleFieldChange}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={4} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                  Exemplo 3: Com Letras Gregas
                </h2>
                <Inputs
                  fields={advancedFields}
                  onChange={handleFieldChange}
                />
              </div>
            </GridItem>
          </GridLayout>

          {/* Exibição dos valores */}
          <GridLayout>
            <GridItem cols={12} colsMd={12} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Valores Capturados
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {Object.entries(values).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-primary">
                        {value === '' ? '(vazio)' : String(value)}
                      </span>
                    </p>
                  ))}
                </div>

                <div className="mt-6 space-y-2 rounded-md bg-muted p-4 text-xs">
                  <p className="font-semibold text-foreground">Uso:</p>
                  <pre className="overflow-x-auto text-muted-foreground">
{`<Inputs
  fields={[
    {
      type: 'number',
      id: 'height',
      label: 'Altura',
      value: values.height,
      unit: 'cm',
      ...
    },
    {
      type: 'select',
      id: 'material',
      label: 'Material',
      value: values.material,
      options: [...],
      unit: 'tipo',
      ...
    }
  ]}
  onChange={(fieldId, value) => {
    // Atualizar estado
  }}
/>`}
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
