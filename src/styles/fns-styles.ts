import * as dashboardStyles from './dashboard-styles';

// Re-export all dashboard styles
export * from './dashboard-styles';

// Specific styles for FNS page
export const inputSectionLayoutStyles = {
  container: dashboardStyles.inputSectionStyles.container,
  header: `${dashboardStyles.inputSectionStyles.header}`,
  headerContent: dashboardStyles.inputSectionStyles.headerContent,
  headerTitle: dashboardStyles.inputSectionStyles.headerTitle,
  contentWrapper: dashboardStyles.inputSectionStyles.content,
  geometryGrid: dashboardStyles.gridLayoutStyles.geometryGrid,
  materialEffortGrid: `${dashboardStyles.gridLayoutStyles.materialEffortGrid} grid-cols-1 lg:grid-cols-3`,
  singleCardGrid: 'grid grid-cols-1 gap-2 md:gap-3',
};

export const contentSectionLayoutStyles = {
  wrapper: 'flex flex-col gap-3 md:gap-4 lg:gap-6',
  summaryCard: dashboardStyles.cardStyles.base,
  summaryContent: `${dashboardStyles.cardStyles.padding}`,
  summaryTitle: `${dashboardStyles.cardStyles.title}`,
  summaryGrid: dashboardStyles.gridLayoutStyles.summaryGrid,
  resultsCard: dashboardStyles.cardStyles.base,
  resultsContent: `${dashboardStyles.cardStyles.padding}`,
  resultsTitle: `${dashboardStyles.cardStyles.title}`,
  resultsPlaceholder: dashboardStyles.emptyStateStyles.container,
  resultsPlaceholderText: dashboardStyles.emptyStateStyles.text,
};