'use client';

import { forwardRef, Ref, ReactNode } from 'react';

export interface InputsCardProps {
  title: string;
  unit: string;
  children: ReactNode;
  className?: string;
}

export const InputsCard = forwardRef<HTMLDivElement, InputsCardProps>(
  (
    {
      title,
      unit,
      children,
      className = '',
    },
    ref: Ref<HTMLDivElement>
  ) => {
    return (
      <div ref={ref} className={`${className}`}>
        {/* Estrutura de tabela - estilo unificado */}
        <div className="border border-input shadow-sm bg-background">
          {/* Header como primeira linha da tabela */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-input bg-muted/30">
            <h3 className="!text-xs font-bold text-foreground">{title}</h3>
            <span className="bg-background border border-input px-2 py-0.5 !text-[10px] font-medium text-muted-foreground">
              {unit}
            </span>
          </div>

          {/* Conteúdo */}
          {children}
        </div>
      </div>
    );
  }
);

InputsCard.displayName = 'InputsCard';
