'use client';

import { OneNumberInput } from '../atoms/one-number-input';
import { OneSelectInput, type SelectOption } from '../atoms/one-select-input';

// Tipos para o campo de input
export interface NumberInputField {
  type: 'number';
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}

export interface SelectInputField {
  type: 'select';
  id: string;
  label: string;
  value: string | number;
  options: SelectOption[];
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export type InputField = NumberInputField | SelectInputField;

interface InputsProps {
  fields: InputField[];
  onChange: (fieldId: string, value: number | string) => void;
  className?: string;
  gap?: string;
}

export function Inputs({
  fields,
  onChange,
  className = '',
  gap = 'gap-4',
}: InputsProps) {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {fields.map((field) => {
        if (field.type === 'number') {
          const numberField = field as NumberInputField;
          return (
            <OneNumberInput
              key={numberField.id}
              label={numberField.label}
              value={numberField.value}
              onChange={(value) => onChange(numberField.id, value)}
              unit={numberField.unit}
              placeholder={numberField.placeholder}
              disabled={numberField.disabled}
              min={numberField.min}
              max={numberField.max}
              step={numberField.step}
              error={numberField.error}
            />
          );
        }

        if (field.type === 'select') {
          const selectField = field as SelectInputField;
          return (
            <OneSelectInput
              key={selectField.id}
              label={selectField.label}
              value={selectField.value}
              onChange={(value) => onChange(selectField.id, value)}
              options={selectField.options}
              unit={selectField.unit}
              placeholder={selectField.placeholder}
              disabled={selectField.disabled}
              error={selectField.error}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
