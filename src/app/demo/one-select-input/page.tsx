'use client';

import { useState } from 'react';
import { OneSelectInput, type SelectOption } from '@/components/user/atoms/one-select-input';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function OneSelectInputDemo() {
  // Estados para os selects
  const [unity, setUnity] = useState<string | number>('');
  const [material, setMaterial] = useState<string | number>('concrete');
  const [temperature, setTemperature] = useState<string | number>('');
  const [greekSymbol, setGreekSymbol] = useState<string | number>('');

  // Opções - JSON com label (o que aparece) e value (o que é retornado)
  const unityOptions: SelectOption[] = [
    { label: 'Selecione uma unidade', value: '' },
    { label: 'Metro (m)', value: 'm' },
    { label: 'Centímetro (cm)', value: 'cm' },
    { label: 'Milímetro (mm)', value: 'mm' },
    { label: 'Quilômetro (km)', value: 'km' },
  ];

  const materialOptions: SelectOption[] = [
    { label: 'Concreto', value: 'concrete' },
    { label: 'Aço', value: 'steel' },
    { label: 'Madeira', value: 'wood' },
    { label: 'Alumínio', value: 'aluminum' },
    { label: 'Vidro', value: 'glass' },
  ];

  const temperatureOptions: SelectOption[] = [
    { label: 'Selecione a temperatura', value: '' },
    { label: 'Muito Frio (< 0°C)', value: 'very_cold' },
    { label: 'Frio (0°C - 10°C)', value: 'cold' },
    { label: 'Moderado (10°C - 20°C)', value: 'moderate' },
    { label: 'Quente (20°C - 30°C)', value: 'hot' },
    { label: 'Muito Quente (> 30°C)', value: 'very_hot' },
  ];

  // Opções com letras gregas
  const greekSymbolOptions: SelectOption[] = [
    { label: 'Selecione um símbolo', value: '' },
    { label: 'α (alfa)', value: 'alpha' },
    { label: 'β (beta)', value: 'beta' },
    { label: 'γ (gama)', value: 'gamma' },
    { label: 'δ (delta)', value: 'delta' },
    { label: 'ε (epsilon)', value: 'epsilon' },
    { label: 'λ (lambda)', value: 'lambda' },
    { label: 'μ (mi)', value: 'mu' },
    { label: 'π (pi)', value: 'pi' },
    { label: 'ρ (rho)', value: 'rho' },
    { label: 'σ (sigma)', value: 'sigma' },
    { label: 'τ (tau)', value: 'tau' },
    { label: 'Φ (phi)', value: 'phi' },
    { label: 'Ψ (psi)', value: 'psi' },
    { label: 'Ω (ômega)', value: 'omega' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            OneSelectInput Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Componente de select com texto, opções e unidade
          </p>
        </div>
      </div>

      <main className="w-full">
        <GridContainer className="py-6">
          <GridLayout className="mb-6">
            <GridItem cols={12} colsMd={6} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Básico
                </h2>

                <OneSelectInput
                  label="Unidade de Comprimento"
                  value={unity}
                  onChange={setUnity}
                  options={unityOptions}
                  unit="comprimento"
                  className="mb-4"
                />

                <OneSelectInput
                  label="Material"
                  value={material}
                  onChange={setMaterial}
                  options={materialOptions}
                  unit="tipo"
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={6} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Com Letras Gregas
                </h2>

                <OneSelectInput
                  label="Símbolo Grego (α, β, γ...)"
                  value={greekSymbol}
                  onChange={setGreekSymbol}
                  options={greekSymbolOptions}
                  unit="símbolo"
                  className="mb-4"
                />

                <OneSelectInput
                  label="Temperatura"
                  value={temperature}
                  onChange={setTemperature}
                  options={temperatureOptions}
                  unit="°C"
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
                  <p>
                    Unidade:{' '}
                    <span className="text-primary">
                      {unity === '' ? '(não selecionado)' : unity}
                    </span>
                  </p>
                  <p>
                    Material: <span className="text-primary">{material}</span>
                  </p>
                  <p>
                    Símbolo Grego:{' '}
                    <span className="text-primary">
                      {greekSymbol === '' ? '(não selecionado)' : greekSymbol}
                    </span>
                  </p>
                  <p>
                    Temperatura:{' '}
                    <span className="text-primary">
                      {temperature === '' ? '(não selecionado)' : temperature}
                    </span>
                  </p>
                </div>

                <div className="mt-6 space-y-2 rounded-md bg-muted p-4 text-xs">
                  <p className="font-semibold text-foreground">Estrutura das Opções:</p>
                  <pre className="overflow-x-auto text-muted-foreground">
{`interface SelectOption {
  label: string;    // O que aparece para o usuário
  value: string|number;  // Valor retornado
}`}
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
