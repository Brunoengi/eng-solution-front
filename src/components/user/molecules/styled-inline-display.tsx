'use client';

import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Tone = 'light' | 'dark';

const toneStyles: Record<Tone, { container: string; label: string; value: string }> = {
  light: {
    container: 'border-slate-200 bg-slate-50/80',
    label: 'text-slate-600',
    value: 'bg-white text-slate-600',
  },
  dark: {
    container: 'border-white/10 bg-slate-950/20',
    label: 'text-slate-200',
    value: 'bg-white text-slate-600',
  },
};

interface StyledInlineDisplayProps {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: Tone;
  containerClassName?: string;
  labelClassName?: string;
  labelWidthClassName?: string;
  valueClassName?: string;
}

export function StyledInlineDisplay({
  label,
  value,
  tone = 'light',
  containerClassName,
  labelClassName,
  labelWidthClassName,
  valueClassName,
}: StyledInlineDisplayProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:gap-3',
        styles.container,
        containerClassName
      )}
    >
      <Label
        className={cn(
          'text-xs font-semibold leading-none',
          'w-full sm:w-[124px] sm:shrink-0',
          styles.label,
          labelWidthClassName,
          labelClassName
        )}
      >
        {label}
      </Label>
      <div
        className={cn(
          'flex min-h-9 w-full items-center rounded-md px-3 py-2 text-sm',
          'sm:w-[156px] sm:max-w-full',
          styles.value,
          valueClassName
        )}
      >
        {value}
      </div>
    </div>
  );
}
