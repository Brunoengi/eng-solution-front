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

    const handleIncrement = (input: CompactNumberInputItem) => {
      const currentValue = input.value === '' ? 0 : Number(input.value);
      const step = input.step || 1;
      const newValue = currentValue + step;
      
      if (input.max === undefined || newValue <= input.max) {
        onChange(input.id, newValue);
      }
    };

    const handleDecrement = (input: CompactNumberInputItem) => {
      const currentValue = input.value === '' ? 0 : Number(input.value);
      const step = input.step || 1;
      const newValue = currentValue - step;
      
      if (input.min === undefined || newValue >= input.min) {
        onChange(input.id, newValue);
      }
    };

    return (
      <div ref={ref} className={`${className}`}>
        {/* Estrutura de tabela - estilo unificado */}
        <div className="border border-input shadow-sm bg-background">
          {/* Header como primeira linha da tabela */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-input bg-muted/30">
            <h3 className="text-xs font-semibold text-foreground">{title}</h3>
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

                {/* Coluna 2: Controles (botões + input) */}
                <div className="relative flex items-center">
                  {/* Botão de Decremento */}
                  <button
                    type="button"
                    onClick={() => handleDecrement(input)}
                    disabled={disabled || (input.min !== undefined && Number(input.value) <= input.min)}
                    className="bg-background hover:bg-accent active:bg-accent/80 p-1.5 h-7 focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    <svg
                      className="w-2.5 h-2.5 text-foreground"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 18 2"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 1h16"
                      />
                    </svg>
                  </button>

                  {/* Input */}
                  <Input
                    type="number"
                    value={input.value}
                    onChange={(e) => handleChange(input.id, e)}
                    placeholder={input.placeholder || '0'}
                    disabled={disabled}
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    className={`h-7 text-xs font-medium ${input.inputWidth || 'w-14'} px-2 py-0 text-center border-0 bg-muted/30 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
                      input.error
                        ? 'bg-destructive/10 focus-visible:bg-destructive/20'
                        : 'focus-visible:bg-accent/20'
                    }`}
                  />

                  {/* Botão de Incremento */}
                  <button
                    type="button"
                    onClick={() => handleIncrement(input)}
                    disabled={disabled || (input.max !== undefined && Number(input.value) >= input.max)}
                    className="bg-background hover:bg-accent active:bg-accent/80 p-1.5 h-7 focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    <svg
                      className="w-2.5 h-2.5 text-foreground"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 18 18"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 1v16M1 9h16"
                      />
                    </svg>
                  </button>
                </div>
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
