'use client';

import { type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DashboardPanelCardProps {
  title?: ReactNode;
  tooltipContent?: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  titleClassName?: string;
  children: ReactNode;
}

export function DashboardPanelCard({
  title,
  tooltipContent,
  headerLeft,
  headerRight,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  titleClassName = 'text-sm font-semibold',
  children,
}: DashboardPanelCardProps) {
  const resolvedHeaderLeft = headerLeft ?? (
    <div className="flex items-center gap-2">
      {title ? <h2 className={titleClassName}>{title}</h2> : null}
      {tooltipContent ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground hover:text-foreground" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );

  return (
    <section className={`overflow-hidden rounded-lg border border-border bg-card ${className}`}>
      {(resolvedHeaderLeft || headerRight) ? (
        <div className={`border-b border-border bg-muted/25 px-3 py-2 ${headerClassName}`}>
          <div className="flex items-center justify-between gap-3">
            {resolvedHeaderLeft}
            {headerRight ?? null}
          </div>
        </div>
      ) : null}

      <div className={`p-3 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}