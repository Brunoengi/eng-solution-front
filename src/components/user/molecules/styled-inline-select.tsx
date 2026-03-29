'use client';

import * as React from 'react';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Tone = 'light' | 'dark';

const toneStyles: Record<Tone, { container: string; label: string; trigger: string }> = {
  light: {
    container: 'border-slate-200 bg-slate-50/80',
    label: 'text-slate-600',
    trigger: 'bg-white text-slate-900',
  },
  dark: {
    container: 'border-white/10 bg-slate-950/20',
    label: 'text-slate-200',
    trigger: 'bg-white text-slate-900',
  },
};

interface StyledInlineSelectProps {
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  tone?: Tone;
  containerClassName?: string;
  labelClassName?: string;
  labelWidthClassName?: string;
  wrapperClassName?: string;
  triggerClassName?: string;
}

export function StyledInlineSelect({
  label,
  value,
  onValueChange,
  placeholder,
  children,
  tone = 'light',
  containerClassName,
  labelClassName,
  labelWidthClassName,
  wrapperClassName,
  triggerClassName,
}: StyledInlineSelectProps) {
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
      <div className={cn('w-full min-w-0 sm:w-[156px] sm:max-w-full', wrapperClassName)}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={cn('h-9 border-0 px-3 shadow-none focus:ring-1', styles.trigger, triggerClassName)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
