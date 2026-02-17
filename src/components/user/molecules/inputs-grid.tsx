'use client';

import { forwardRef, Ref, ReactNode } from 'react';

export interface InputsGridProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  minColumnWidth?: number; // Largura mínima da coluna em pixels (padrão: 140 para números, 200 para selects)
}

export const InputsGrid = forwardRef<HTMLDivElement, InputsGridProps>(
  (
    {
      children,
      disabled = false,
      className = '',
      minColumnWidth = 140,
    },
    ref: Ref<HTMLDivElement>
  ) => {
    return (
      <div 
        ref={ref}
        className={`flex flex-wrap justify-between gap-x-3 gap-y-2 px-2 py-2 ${disabled ? 'opacity-60' : ''} ${className}`}
      >
        {children}
      </div>
    );
  }
);

InputsGrid.displayName = 'InputsGrid';
