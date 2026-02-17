'use client';

import { forwardRef, Ref, ChangeEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CompactNumberInputItem {
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

interface CompactNumberInputsProps {
  title: string;
  unit: string;
  inputs: CompactNumberInputItem[];
  onChange: (inputId: string, value: number | string) => void;
  disabled?: boolean;
  className?: string;
}

export const CompactNumberInputs = forwardRef<HTMLDivElement, CompactNumberInputsProps>(
  (
    {
      title,
      unit,
      inputs,
      onChange,
      disabled = false,
      className = '',
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

          {/* Linhas de inputs */}
          {inputs.map((input, index) => (
            <div key={input.id}>
              {/* Linha da tabela com 2 colunas */}
              <div className={`grid grid-cols-[1fr_auto] items-center gap-3 px-2 py-1 ${
                index !== inputs.length - 1 ? 'border-b border-input' : ''
              } ${disabled ? 'opacity-60' : ''} hover:bg-accent/5 transition-colors`}>
                {/* Coluna 1: Label */}
                <Label className="text-xs font-medium text-foreground whitespace-nowrap">
                  {input.label}
                </Label>

                {/* Coluna 2: Input */}
                <Input
                  type="number"
                  value={input.value}
                  onChange={(e) => handleChange(input.id, e)}
                  placeholder={input.placeholder || '0'}
                  disabled={disabled}
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  className={`h-7 text-xs font-medium ${input.inputWidth || 'w-20'} px-2 py-0 text-center border border-input bg-background focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
                    input.error
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
              </div>

              {/* Erro */}
              {input.error && (
                <p className="text-[10px] font-medium text-destructive px-2 pb-1">
                  {input.error}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

CompactNumberInputs.displayName = 'CompactNumberInputs';
