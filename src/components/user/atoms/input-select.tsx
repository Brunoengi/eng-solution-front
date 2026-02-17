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

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface InputSelectProps {
  id: string;
  label: string | ReactNode;
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  inputWidth?: string;
  labelWidth?: string;
  className?: string;
}

export const InputSelect = forwardRef<HTMLButtonElement, InputSelectProps>(
  (
    {
      id,
      label,
      value,
      options,
      onChange,
      placeholder = 'Selecione',
      error,
      disabled = false,
      inputWidth,
      labelWidth = 'min-w-[80px]',
      className = '',
    },
    ref: Ref<HTMLButtonElement>
  ) => {
    return (
      <div className={`flex items-center gap-2 min-w-0 ${className}`}>
        {/* Label com largura configurável */}
        <Label 
          htmlFor={id}
          className={`!text-xs font-medium leading-normal text-foreground whitespace-nowrap overflow-hidden text-ellipsis ${labelWidth}`}
        >
          {label}
        </Label>

        {/* Select com largura fixa */}
        <div className="flex flex-col gap-0.5">
          <Select
            value={String(value)}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger
              ref={ref}
              id={id}
              className={`h-10 !text-xs font-medium leading-normal ${inputWidth || 'w-32'} px-3 py-2 border border-input bg-background focus-visible:ring-1 focus-visible:ring-ring transition-colors ${
                error
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={`${id}-${option.value}`}
                  value={String(option.value)}
                  className="!text-xs"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Erro */}
          {error && (
            <p className="!text-[10px] font-medium text-destructive whitespace-nowrap overflow-hidden text-ellipsis">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

InputSelect.displayName = 'InputSelect';
