/**
 * Estilos padronizados para o Dashboard
 * Com suporte responsivo para: mobile, tablet e desktop
 */

// Breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Spacing (padding/margin)
export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '2.5rem',
  '2xl': '3rem',
}



// Header Styles
export const headerStyles = {
  container: 'border-b border-border bg-card',
  wrapper: 'container mx-auto px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6',
  title: 'text-base md:text-lg lg:text-xl font-bold text-foreground',
  subtitle: 'text-xs text-muted-foreground mt-1 md:mt-2',
};

// Main Content Styles
export const mainContentStyles = {
  container: 'w-full',
  gridContainer: 'py-3 md:py-4 lg:py-6',
};

// Card Styles
export const cardStyles = {
  base: 'rounded-lg border border-border bg-card shadow-sm',
  header: 'border-b border-border bg-slate-100 dark:bg-slate-800 px-3 md:px-4 py-2 md:py-3 rounded-t-lg',
  title: 'text-xs font-semibold text-foreground',
  content: 'flex flex-col gap-2 p-2 md:p-3 lg:p-4',
  subcard: 'rounded-lg border border-border bg-card p-2 md:p-3 shadow-sm',
  padding: 'p-3 md:p-4 lg:p-5',
};

// Input Sections
export const inputSectionStyles = {
  container: 'rounded-lg border border-border bg-slate-50 dark:bg-slate-900',
  header: 'border-b border-border bg-slate-100 dark:bg-slate-800 px-3 md:px-4 py-2 md:py-3 rounded-t-lg',
  headerContent: 'flex items-center justify-between',
  headerTitle: 'text-xs md:text-sm font-semibold text-foreground',
  icon: 'h-4 md:h-5 w-4 md:w-5 cursor-help text-muted-foreground hover:text-foreground transition-colors',
  content: 'flex flex-col gap-2 p-2 md:p-3',
};

// Grid Layout Styles
export const gridLayoutStyles = {
  // Para seções de entrada e imagem (1/4 e 3/4)
  mainGrid: {
    inputSection: 'cols-12 md:cols-3 sm:cols-12 md:min-w-[18rem] lg:min-w-[22rem] 2xl:min-w-[24rem]',
    contentSection: 'cols-12 md:cols-9 sm:cols-12',
  },
  // Para layout interno de geometria (input + imagem)
  geometryGrid: 'grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch',
  // Para layout de material e esforços
  materialEffortGrid: 'grid gap-2 md:gap-3',
  // Para cards informativos
  summaryGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4',
  // Para múltiplas colunas
  responsiveGrid: (cols: number) => ({
    sm: 'grid-cols-1',
    md: cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4',
    lg: cols === 2 ? 'lg:grid-cols-2' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
  }),
};

// Summary Card Styles
export const summaryCardStyles = {
  container: 'rounded-lg bg-muted p-2 md:p-3 lg:p-4',
  label: 'text-xs text-muted-foreground font-medium',
  value: 'mt-2 font-mono text-xs text-foreground',
};

// Image Styles
export const imageStyles = {
  container: 'rounded-lg border border-border bg-card p-3 md:p-4 shadow-sm flex items-center justify-center',
  image: 'max-h-40 md:max-h-52 lg:max-h-64 w-full object-contain',
};

// Placeholder/Empty State Styles
export const emptyStateStyles = {
  container: 'flex min-h-72 md:min-h-80 lg:min-h-96 items-center justify-center rounded-lg bg-muted',
  text: 'text-xs text-muted-foreground text-center px-4',
};

// Tooltip Styles
export const tooltipStyles = {
  trigger: 'h-4 md:h-5 w-4 md:w-5 cursor-help text-muted-foreground hover:text-foreground transition-colors',
  content: 'max-w-xs md:max-w-sm text-xs',
  section: 'space-y-2',
  sectionTitle: 'font-semibold text-xs',
  sectionText: 'text-xs',
};

// Flex Utilities
export const flexStyles = {
  between: 'flex items-center justify-between',
  center: 'flex items-center justify-center',
  col: 'flex flex-col',
  colGap: (gap: string) => `flex flex-col gap-${gap}`,
};

// Responsive Classes Builder
export const classNameBuilder = {
  // Constrói classe responsiva para padding
  padding: (sm: string, md: string, lg: string) =>
    `p-${sm} md:p-${md} lg:p-${lg}`,
  
  // Constrói classe responsiva para text size
  textSize: (sm: string, md: string, lg: string) =>
    `text-${sm} md:text-${md} lg:text-${lg}`,
  
  // Constrói classe responsiva para gap
  gap: (sm: string, md: string, lg: string) =>
    `gap-${sm} md:gap-${md} lg:gap-${lg}`,
};

// Font Sizes
export const fontSizes = {
  // Para tags semânticas
  h1: 'text-xl',
  h2: 'text-lg',
  h3: 'text-base',
  p: 'text-xs',

  // Extra small - Geralmente para labels, hints
  xs: 'text-xs',
  // Small - Para subtítulos, labels secundários
  sm: 'text-xs',
  // Base - Tamanho padrão para texto do corpo
  base: 'text-xs',
  // Large - Para títulos de seções
  lg: 'text-sm',
  // Extra large - Para títulos principais
  xl: 'text-base',
  // 2XL - Para títulos grandes
  '2xl': 'text-lg',
  // 3XL - Para títulos de página
  '3xl': 'text-xl',
};

// Font Sizes Responsivos (sm, md, lg breakpoints)
export const fontSizesResponsive = {
  // Para tags semânticas
  h1: 'text-lg md:text-xl lg:text-2xl',
  h2: 'text-base md:text-lg lg:text-xl',
  h3: 'text-sm md:text-base lg:text-lg',
  p: 'text-xs md:text-sm',

  // Para subtítulos
  subtitle: 'text-xs',
  // Para títulos de cards
  cardTitle: 'text-xs md:text-sm',
  // Para títulos de seções
  sectionTitle: 'text-sm md:text-base',
  // Para títulos de página
  pageTitle: 'text-base md:text-lg lg:text-xl',
  // Para texto do corpo
  body: 'text-xs',
  // Para labels de inputs
  label: 'text-xs',
  // Para valores em destaque
  highlight: 'text-sm md:text-base',
  // Para informações pequenas
  small: 'text-xs',
};
