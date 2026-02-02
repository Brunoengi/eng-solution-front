'use client';

import { useState } from 'react';
import { OneNumberInput } from '@/components/user/atoms/one-number-input';
import { GridContainer, GridLayout, GridItem } from '@/components/user/layout/grid-layout';

export default function OneNumberInputDemo() {
  const [temperature, setTemperature] = useState<number | string>(25);
  const [weight, setWeight] = useState<number | string>(70);
  const [distance, setDistance] = useState<number | string>('');
  const [volume, setVolume] = useState<number | string>(1000);
  const [error, setError] = useState('');

  const handleWeightChange = (value: number | string) => {
    // Exemplo de validação
    if (typeof value === 'number' && value > 500) {
      setError('Peso não pode ser maior que 500 kg');
    } else {
      setError('');
    }
    setWeight(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            OneNumberInput Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Componente para entrada de valores numéricos com unidades
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

                <OneNumberInput
                  label="Temperatura"
                  value={temperature}
                  onChange={setTemperature}
                  unit="°C"
                  placeholder="Digite a temperatura"
                  min={-50}
                  max={50}
                  step={0.1}
                  className="mb-4"
                />

                <OneNumberInput
                  label="Distância"
                  value={distance}
                  onChange={(value) => setDistance(value)}
                  unit="km"
                  placeholder="Digite a distância"
                  step={0.5}
                />
              </div>
            </GridItem>

            <GridItem cols={12} colsMd={6} colsSm={12}>
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Com Validação e Unidades
                </h2>

                <OneNumberInput
                  label="Peso"
                  value={weight}
                  onChange={handleWeightChange}
                  unit="kg"
                  placeholder="Digite o peso"
                  min={0}
                  max={500}
                  error={error}
                  className="mb-4"
                />

                <OneNumberInput
                  label="Volume"
                  value={volume}
                  onChange={setVolume}
                  unit="mL"
                  placeholder="Digite o volume"
                  min={0}
                  step={100}
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
                    Temperatura: <span className="text-primary">{temperature}</span> °C
                  </p>
                  <p>
                    Peso: <span className="text-primary">{weight}</span> kg
                  </p>
                  <p>
                    Distância:{' '}
                    <span className="text-primary">
                      {distance === '' ? '(vazio)' : distance}
                    </span>{' '}
                    km
                  </p>
                  <p>
                    Volume: <span className="text-primary">{volume}</span> mL
                  </p>
                </div>
              </div>
            </GridItem>
          </GridLayout>
        </GridContainer>
      </main>
    </div>
  );
}
