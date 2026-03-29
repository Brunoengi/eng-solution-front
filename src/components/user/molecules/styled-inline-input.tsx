'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Tone = 'light' | 'dark';

export interface StyledInlineInputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  label: React.ReactNode;
  tone?: Tone;
  containerClassName?: string;
  labelClassName?: string;
  labelWidthClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
}

const toneStyles: Record<Tone, { container: string; label: string; input: string }> = {
  light: {
    container: 'border-slate-200 bg-slate-50/80',
    label: 'text-slate-600',
    input: 'bg-white text-slate-900',
  },
  dark: {
    container: 'border-white/10 bg-slate-950/20',
    label: 'text-slate-200',
    input: 'bg-white text-slate-900',
  },
};

export const StyledInlineInput = React.forwardRef<HTMLInputElement, StyledInlineInputProps>(
  (
    {
      id,
      label,
      tone = 'light',
      containerClassName,
      labelClassName,
      labelWidthClassName,
      inputWrapperClassName,
      inputClassName,
      ...props
    },
    ref
  ) => {
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
          htmlFor={id}
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
        <div className={cn('w-full min-w-0 sm:w-[156px] sm:max-w-full', inputWrapperClassName)}>
          <Input
            id={id}
            ref={ref}
            className={cn(
              'h-9 border-0 px-3 shadow-none focus-visible:ring-1',
              styles.input,
              inputClassName
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);

StyledInlineInput.displayName = 'StyledInlineInput';
