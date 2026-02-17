import React, { ReactNode } from 'react';

interface GridLayoutProps {
  children: ReactNode;
  className?: string;
}

export function GridLayout({ children, className = '' }: GridLayoutProps) {
  return (
    <div className={`grid grid-cols-12 gap-3 ${className}`}>
      {children}
    </div>
  );
}

// Mapa de classes col-span para evitar classe dinâmicas não compiladas pelo Tailwind
const colSpanMap: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

const mdColSpanMap: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const smColSpanMap: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12',
};

interface GridItemProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
}

export function GridItem({
  children,
  cols = 12,
  colsMd = 6,
  colsSm = 12,
  className = '',
}: GridItemProps) {
  const colsClass = colSpanMap[cols];
  const colsMdClass = mdColSpanMap[colsMd];
  const colsSmClass = smColSpanMap[colsSm];

  return (
    <div className={`${colsClass} ${colsMdClass} ${colsSmClass} ${className}`}>
      {children}
    </div>
  );
}

interface GridContainerProps {
  children: ReactNode;
  className?: string;
}

export function GridContainer({ children, className = '' }: GridContainerProps) {
  return (
    <div className={`container mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
}

interface GridDashboardProps {
  children: ReactNode;
  className?: string;
}

export function GridDashboard({ children, className = '' }: GridDashboardProps) {
  return (
    <div className={`w-full px-2 ${className}`}>
      {children}
    </div>
  );
}
