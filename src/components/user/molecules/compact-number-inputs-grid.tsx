'use client';

import { forwardRef, Ref, ChangeEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CompactNumberInputGridItem {
  id: string;
  label: string | ReactNode;
  value: number | string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  inputWidth?: string;
}

interface CompactNumberInputsGridProps {
  title: string;
  unit: string;
  inputs: CompactNumberInputGridItem[];
  onChange: (inputId: string, value: number | string) => void;
  disabled?: boolean;
  className?: string;
  columnsPerRow?: number; // Deprecated: O layout agora é flexível e se ajusta automaticamente
}

export const CompactNumberInputsGrid = forwardRef<HTMLDivElement, CompactNumberInputsGridProps>(
  (
    {
      title,
      unit,
      inputs,
      onChange,
      disabled = false,
      className = '',
      columnsPerRow, // Ignorado, mantido para compatibilidade
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const handleChange = (inputId: string, e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '') {
        onChange(inputId, '');
      } else {
        onChange(inputId, parseFloat(inputValue) || inputValue);
      }
    };

    return (
      <div ref={ref} className={`${className}`}>
        {/* Estrutura de tabela - estilo unificado */}
        <div className="border border-input shadow-sm bg-background">
          {/* Header como primeira linha da tabela */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-input bg-muted/30">
            <h3 className="text-xs font-bold text-foreground">{title}</h3>
            <span className="bg-background border border-input px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {unit}
            </span>
          </div>

          {/* Container com grid responsivo tipo tabela */}
          <div 
            className={`grid gap-x-3 gap-y-2 px-2 py-2 ${disabled ? 'opacity-60' : ''}`}
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
            }}
          >
            {inputs.map((input) => (
              <div key={input.id} className="grid grid-cols-[minmax(80px,auto)_1fr] items-center gap-2 min-w-0">
                {/* Label com tamanho mínimo */}
                <Label className="text-xs font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {input.label}
                </Label>

                {/* Input que ocupa espaço restante */}
                <div className="flex flex-col gap-0.5">
                  <Input
                    type="number"
                    value={input.value}
                    onChange={(e) => handleChange(input.id, e)}
                    placeholder={input.placeholder || '0'}
                    disabled={disabled}
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    className={`h-7 text-xs font-medium ${input.inputWidth || 'w-full'} px-2 py-0 text-center border border-input bg-background focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
                      input.error
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }`}
                  />

                  {/* Erro */}
                  {input.error && (
                    <p className="text-[10px] font-medium text-destructive whitespace-nowrap overflow-hidden text-ellipsis">
                      {input.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

CompactNumberInputsGrid.displayName = 'CompactNumberInputsGrid';
