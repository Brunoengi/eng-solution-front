'use client';

import { forwardRef, Ref, ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { type SelectOption } from '../atoms/oneSelectInput';

export interface SelectInputItem {
  id: string;
  label: string | ReactNode;
  value: string | number;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  inputWidth?: string;
}

interface ManySelectInputsProps {
  title: string;
  unit: string;
  inputs: SelectInputItem[];
  onChange: (inputId: string, value: string | number) => void;
  disabled?: boolean;
  className?: string;
  gridCols?: number;
}

export const ManySelectInputs = forwardRef<HTMLDivElement, ManySelectInputsProps>(
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
    return (
      <div ref={ref} className={`flex flex-col gap-4 ${className}`}>
        {/* Header com Título e Unidade */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        </div>

        {/* Grid de Selects */}
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

              {/* Select */}
              <Select
                value={String(input.value)}
                onValueChange={(value) => onChange(input.id, value)}
                disabled={disabled}
              >
                <SelectTrigger
                  className={`h-8 text-sm ${input.inputWidth || 'w-24'} ${
                    input.error
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                >
                  <SelectValue placeholder={input.placeholder || 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {input.options
                    .filter(
                      (option) =>
                        option.value !== '' && option.value !== null
                    )
                    .map((option) => (
                      <SelectItem
                        key={`${option.value}`}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

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

ManySelectInputs.displayName = 'ManySelectInputs';
