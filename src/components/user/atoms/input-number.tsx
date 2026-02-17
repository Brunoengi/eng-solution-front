'use client';

import { forwardRef, Ref, ChangeEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface InputNumberProps {
  id: string;
  label: string | ReactNode;
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  disabled?: boolean;
  inputWidth?: string;
  labelWidth?: string;
  className?: string;
}

export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      placeholder = '0',
      min,
      max,
      step,
      error,
      disabled = false,
      inputWidth,
      labelWidth = 'min-w-[80px]',
      className = '',
    },
    ref: Ref<HTMLInputElement>
  ) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '') {
        onChange('');
      } else {
        onChange(parseFloat(inputValue) || inputValue);
      }
    };

    return (
      <div className={`flex items-center gap-2 min-w-0 ${className}`}>
        {/* Label com largura configurável */}
        <Label 
          htmlFor={id}
          className={`!text-xs font-medium leading-normal text-foreground whitespace-nowrap overflow-hidden text-ellipsis ${labelWidth}`}
        >
          {label}
        </Label>

        {/* Input com largura fixa */}
        <div className="flex flex-col gap-0.5">
          <Input
            ref={ref}
            id={id}
            type="number"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={`h-8 !text-xs font-medium leading-normal ${inputWidth || 'w-24'} px-1 py-1 text-center border border-input bg-background focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${
              error
                ? 'border-destructive focus-visible:ring-destructive'
                : ''
            }`}
          />

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

InputNumber.displayName = 'InputNumber';
