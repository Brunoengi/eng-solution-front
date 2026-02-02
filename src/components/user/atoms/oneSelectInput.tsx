'use client';

import { forwardRef, Ref } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface OneSelectInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  inputWidth?: string;
}

export const OneSelectInput = forwardRef<HTMLButtonElement, OneSelectInputProps>(
  (
    {
      label,
      value,
      onChange,
      options,
      unit,
      placeholder = 'Selecione uma opção',
      disabled = false,
      error,
      className = '',
      inputWidth = 'flex-1',
    },
    ref: Ref<HTMLButtonElement>
  ) => {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {/* Label */}
        <Label className="text-sm font-semibold text-foreground">{label}</Label>

        {/* Select com Unidade */}
        <div className="flex items-center gap-2">
          <Select
            value={String(value)}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger ref={ref} className={`${inputWidth} ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={`${option.value}`}
                  value={String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

OneSelectInput.displayName = 'OneSelectInput';
