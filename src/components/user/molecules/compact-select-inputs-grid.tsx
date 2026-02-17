'use client';

import { forwardRef, Ref, ReactNode } from 'react';
import { InputSelect, type SelectOption } from '@/components/user/atoms/input-select';
import { InputsGrid } from '@/components/user/molecules/inputs-grid';
import { InputsCard } from '@/components/user/molecules/inputs-card';

export type { SelectOption };

export interface CompactSelectInputGridItem {
  id: string;
  label: string | ReactNode;
  value: string | number;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  inputWidth?: string;
  labelWidth?: string;
}

interface CompactSelectInputsGridProps {
  title: string;
  unit: string;
  inputs: CompactSelectInputGridItem[];
  onChange: (inputId: string, value: string | number) => void;
  disabled?: boolean;
  className?: string;
  columnsPerRow?: number; // Deprecated: O layout agora é flexível e se ajusta automaticamente
}

export const CompactSelectInputsGrid = forwardRef<HTMLDivElement, CompactSelectInputsGridProps>(
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
    return (
      <InputsCard ref={ref} title={title} unit={unit} className={className}>
        <InputsGrid disabled={disabled} minColumnWidth={200}>
          {inputs.map((input) => (
            <InputSelect
              key={input.id}
              id={input.id}
              label={input.label}
              value={input.value}
              options={input.options}
              onChange={(value) => onChange(input.id, value)}
              placeholder={input.placeholder}
              error={input.error}
              disabled={disabled}
              inputWidth={input.inputWidth}
              labelWidth={input.labelWidth}
            />
          ))}
        </InputsGrid>
      </InputsCard>
    );
  }
);

CompactSelectInputsGrid.displayName = 'CompactSelectInputsGrid';
