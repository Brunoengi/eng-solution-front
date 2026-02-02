'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ChangeEvent, forwardRef, Ref } from 'react';

interface OneNumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  className?: string;
  inputWidth?: string;
}

export const OneNumberInput = forwardRef<HTMLInputElement, OneNumberInputProps>(
  (
    {
      label,
      value,
      onChange,
      unit,
      placeholder = '0',
      disabled = false,
      min,
      max,
      step = 1,
      error,
      className = '',
      inputWidth = 'flex-1',
    },
    ref: Ref<HTMLInputElement>
  ) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Se vazio, passa string vazia, senão passa o número
      if (inputValue === '') {
        onChange('');
      } else {
        onChange(parseFloat(inputValue) || inputValue);
      }
    };

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {/* Label */}
        <Label className="text-sm font-semibold text-foreground">{label}</Label>

        {/* Input com Unidade */}
        <div className="flex items-center gap-2">
          <Input
            ref={ref}
            type="number"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={`${inputWidth} ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {unit && (
            <span className="min-w-fit rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        {/* Erro */}
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    );
  }
);

OneNumberInput.displayName = 'OneNumberInput';
