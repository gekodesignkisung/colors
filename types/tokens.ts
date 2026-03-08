// Dynamic key-value map — supports user-added color groups
export type BaseColors = Record<string, string>;

export type TokenOperation =
  | 'source'
  | 'contrast'
  | 'lighten'
  | 'darken'
  | 'setLightness'
  | 'setSaturation'
  | 'colorShift'
  | 'invert'
  | 'manual'
  | 'fixed';

export type TokenSource = string;

export interface TokenRule {
  operation: TokenOperation;
  source: TokenSource;
  param?: number;
  description: string;
  // Naming-based derivation info (set by generateTokensFromNaming)
  namingVariant?: string;
  namingState?: string;
  namingType?: string;
  stateAmount?: number; // hover lighten %, pressed darken %
}

export interface DesignToken {
  id: string;
  name: string;
  group: TokenGroup;
  color: string;
  rule: TokenRule;
  isManual: boolean;
  isFormulaOverride?: boolean; // user customized the formula rule
}

// TokenGroup is now a free string (group key, e.g. 'primary', 'surface', 'custom-1')
export type TokenGroup = string;

export type PreviewTab = 'page' | 'components' | 'modals' | 'typography';

export interface ExportFormat {
  css: string;
  json: Record<string, string>;
}

export interface GenerateRange { min: number; max: number; }
export interface GenerateRule {
  h: GenerateRange;
  s: GenerateRange;
  l: GenerateRange;
}
