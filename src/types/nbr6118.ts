export interface Nbr6118Metadata {
  standard: string;
  edition?: string;
  sourceType: string;
  sourceId: string;
  label: string;
  table?: string;
  chapter?: string;
  clause?: string;
  title: string;
  titleFragments?: Nbr6118InlineFragment[];
  themes?: string[];
}

export interface Nbr6118Payload extends Record<string, unknown> {
  context?: unknown;
}

export type Nbr6118InlineFragmentKind = 'text' | 'sub' | 'sup' | 'lineBreak';

export interface Nbr6118InlineFragment {
  text: string;
  kind?: Nbr6118InlineFragmentKind;
}

export interface Nbr6118TableCell {
  text: string;
  fragments?: Nbr6118InlineFragment[];
  rowSpan?: number;
  colSpan?: number;
  notes?: string[];
}

export interface Nbr6118TableFootnote {
  id: string;
  text: string;
  fragments?: Nbr6118InlineFragment[];
}

export interface Nbr6118TableRepresentation {
  kind: 'table';
  caption?: string;
  captionFragments?: Nbr6118InlineFragment[];
  headerRows: Nbr6118TableCell[][];
  bodyRows: Nbr6118TableCell[][];
  footnotes?: Nbr6118TableFootnote[];
}

export interface Nbr6118Entry {
  metadata: Nbr6118Metadata;
  payload?: Nbr6118Payload;
  representation?: Nbr6118TableRepresentation;
}
