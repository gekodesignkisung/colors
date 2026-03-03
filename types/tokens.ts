export interface BaseColors {
  primary: string;
  secondary: string;
  tertiary: string;
  neutral: string;
}

export type TokenOperation =
  | 'source'
  | 'contrast'
  | 'lighten'
  | 'darken'
  | 'setLightness'
  | 'setSaturation'
  | 'manual'
  | 'fixed';

export type TokenSource = keyof BaseColors | 'error' | 'fixed';

export interface TokenRule {
  operation: TokenOperation;
  source: TokenSource;
  param?: number;
  description: string;
}

export interface DesignToken {
  id: string;
  name: string;
  group: TokenGroup;
  color: string;
  rule: TokenRule;
  isManual: boolean;
}

export type TokenGroup =
  | 'Primary'
  | 'Secondary'
  | 'Tertiary'
  | 'Surface'
  | 'Outline'
  | 'Background'
  | 'Error';

export type PreviewTab = 'page' | 'components' | 'modals' | 'typography';

export interface ExportFormat {
  css: string;
  json: Record<string, string>;
}
