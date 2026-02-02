'use client';

import { forwardRef, Ref, ChangeEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface NumberInputItem {
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

interface ManyNumberInputsProps {
  title: string;
  unit: string;
  inputs: NumberInputItem[];
  onChange: (inputId: string, value: number | string) => void;
  disabled?: boolean;
  className?: string;
  gridCols?: number;
}

export const ManyNumberInputs = forwardRef<HTMLDivElement, ManyNumberInputsProps>(
  (
    {
      title,
      unit,
      inputs,
      onChange,
      disabled = false,
      className = '',
      gridCols = 2,
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
      <div ref={ref} className={`flex flex-col gap-4 ${className}`}>
        {/* Header com Título e Unidade */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        </div>

        {/* Grid de Inputs */}
        <div
          className={`grid gap-4`}
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {inputs.map((input) => (
            <div key={input.id} className="flex flex-col gap-2">
              {/* Label */}
              <Label className="text-xs font-medium text-muted-foreground">
                {input.label}
              </Label>

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
                className={`h-8 text-sm ${input.inputWidth || 'w-24'} ${
                  input.error
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />

              {/* Erro */}
              {input.error && (
                <p className="text-xs font-medium text-destructive">
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

ManyNumberInputs.displayName = 'ManyNumberInputs';
