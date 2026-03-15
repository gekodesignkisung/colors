'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BaseColors, DesignToken, PreviewTab, GenerateRule, KeyColorGenSettings, KeyColorAutoSettings, OpGenSettings } from '@/types/tokens';
import { generateTokensFromNaming, NamingConfig, tokensToCSS, tokensToJSON, applyRule } from '@/lib/generateTokens';
import { generateRandomColor, generateRandomColorInRange } from '@/lib/colorUtils';

// ── Base colors ───────────────────────────────────────────────────────────────
const DEFAULT_BASE: BaseColors = {
  primary:   '#0054DC',
  secondary: '#3876DB',
  tertiary:  '#00ABB0',
  neutral:   '#202020',
};

const DEFAULT_GROUP_ORDER = ['primary', 'secondary', 'tertiary', 'neutral'];

// ── Naming config defaults ────────────────────────────────────────────────────
export const DEFAULT_NAMING_NAMESPACE = 'corca';
export const DEFAULT_NAMING_ORDER = ['namespace', 'theme', 'category', 'variant', 'type', 'state', 'component'];
export const DEFAULT_NAMING_ENABLED = ['namespace', 'variant', 'type', 'state'];
export const DEFAULT_NAMING_VALUES: Record<string, string[]> = {
  theme:     ['light', 'dark'],
  category:  ['color'],
  variant:   ['primary', 'secondary', 'tertiary', 'danger'],
  type:      ['background', 'background-dark', 'background-light', 'card', 'text', 'border', 'icon'],
  state:     ['default', 'hover', 'pressed', 'disabled'],
  component: ['button', 'input', 'card', 'nav'],
};

// names/labels for sections; used when user edits section description
export const DEFAULT_NAMING_DESCRIPTIONS: Record<string, string> = {
  namespace: '전체 토큰을 구분하는 최상위 식별자',
  theme:     'CSS scope로 처리 (토큰명에 포함 안 됨)',
  category:  '토큰의 속성 유형 (color, typography..)',
  variant:   '색상 역할',
  type:      '컬러 적용 대상',
  state:     'UI 인터랙션 상태',
  component: '2단계 alias 레이어에 적용',
};

function makeNamingConfig(state: {
  namingNamespace: string;
  namingOrder: string[];
  namingEnabled: string[];
  namingValues: Record<string, string[]>;
}): NamingConfig {
  return {
    namespace: state.namingNamespace,
    order: state.namingOrder,
    enabled: state.namingEnabled,
    values: state.namingValues,
  };
}

// ── Generate rule defaults ────────────────────────────────────────────────────
export const DEFAULT_GENERATE_RULE: GenerateRule = {
  h: { min: 0,  max: 360 },
  s: { min: 40, max: 80  },
  l: { min: 35, max: 55  },
};

export const DEFAULT_GENERATE_RULES: Record<string, GenerateRule> = {
  neutral: {
    h: { min: 0,  max: 360 },
    s: { min: 0,  max: 15  },
    l: { min: 20, max: 75  },
  },
};

// ── Key color generation settings ──────────────────────────────────────────────
export const DEFAULT_KEY_GEN_SETTINGS: Record<string, KeyColorGenSettings> = {
  primary: {
    mode: 'manual',
    autoSettings: { kind: 'range', rule: { ...DEFAULT_GENERATE_RULE } } as KeyColorAutoSettings,
  },
  secondary: {
    mode: 'auto',
    autoSettings: { kind: 'operation', sourceKey: 'primary', stage1: 'source', operation: 'colorShift', param: 60 } as KeyColorAutoSettings,
  },
  tertiary: {
    mode: 'auto',
    autoSettings: { kind: 'operation', sourceKey: 'primary', stage1: 'source', operation: 'colorShift', param: 120 } as KeyColorAutoSettings,
  },
  neutral: {
    mode: 'auto',
    autoSettings: { kind: 'range', rule: { h: { min: 0, max: 360 }, s: { min: 0, max: 15 }, l: { min: 20, max: 75 } } } as KeyColorAutoSettings,
  },
};

// ── Group labels/descriptions ─────────────────────────────────────────────────
const DEFAULT_GROUP_LABELS: Record<string, string> = {
  primary:   'Primary',
  secondary: 'Secondary',
  tertiary:  'Tertiary',
  neutral:   'Neutral',
};

const DEFAULT_GROUP_DESCRIPTIONS: Record<string, string> = {
  primary:   '',
  secondary: '',
  tertiary:  '',
  neutral:   '',
};

// ── Store interface ───────────────────────────────────────────────────────────
interface ColorStore {
  baseColors: BaseColors;
  tokens: DesignToken[];
  customTokens: DesignToken[];
  isDark: boolean;
  selectedTokenId: string | null;
  selectedTokenPos: { x: number; y: number } | null;
  activePreviewTab: PreviewTab;
  groupOrder: string[];
  groupLabels: Record<string, string>;
  groupDescriptions: Record<string, string>;
  // whether each key color card is currently enabled/visible
  groupEnabled: Record<string, boolean>;
  // helper used internally to filter tokens by the above flags
  _filterTokensByEnabled: (tokens: DesignToken[]) => DesignToken[];
  useOklch: boolean;
  generateRules: Record<string, GenerateRule>;
  keyGenSettings: Record<string, KeyColorGenSettings>;
  globalGenerationMode: 'manual' | 'auto';
  defaultKeyGenSettings: Record<string, KeyColorGenSettings>;
  defaultGenerateRules: Record<string, GenerateRule>;
  defaultTokenFormulaMode: 'formula' | 'manual';
  defaultTokenFormula: { operation: string; source: string; param: number };
  setGroupEnabled: (key: string, enabled: boolean) => void;
  setDefaultNamingNamespace: (ns: string) => void;
  setDefaultNamingValues: (key: string, values: string[]) => void;
  setNamingDescription: (key: string, desc: string) => void;
  setDefaultNamingDescriptions: (key: string, desc: string) => void;

  // Naming config
  namingNamespace: string;
  namingOrder: string[];
  namingEnabled: string[];
  namingValues: Record<string, string[]>;
  namingDescriptions: Record<string, string>;
  // user-adjustable default naming rules (persisted separately)
  defaultNamingNamespace: string;
  defaultNamingValues: Record<string, string[]>;
  defaultNamingDescriptions: Record<string, string>;

  // Preview element token assignments
  previewAssignments: Record<string, string>;

  projectName: string;
  setProjectName: (name: string) => void;
  setPreviewAssignment: (elementId: string, tokenId: string) => void;
  clearPreviewAssignment: (elementId: string) => void;

  setBaseColor: (key: string, hex: string) => void;
  randomizeColors: () => void;
  updateToken: (id: string, patch: Partial<Pick<DesignToken, 'name' | 'color' | 'isManual' | 'isFormulaOverride' | 'rule'>>) => void;
  resetToken: (id: string) => void;
  toggleDark: () => void;
  setSelectedToken: (id: string | null, pos?: { x: number; y: number }) => void;
  setActivePreviewTab: (tab: PreviewTab) => void;
  exportCSS: () => string;
  exportJSON: () => Record<string, string>;
  setGroupLabel: (key: string, label: string) => void;
  setGroupDescription: (key: string, desc: string) => void;
  addGroup: (label: string, hex: string, desc?: string) => void;
  removeGroup: (key: string) => void;
  toggleOklch: () => void;
  setGenerateRule: (key: string, rule: GenerateRule) => void;
  setKeyGenSettings: (key: string, settings: KeyColorGenSettings) => void;
  setGlobalGenerationMode: (mode: 'manual' | 'auto') => void;
  setDefaultKeyGenSettings: (key: string, settings: KeyColorGenSettings) => void;
  setDefaultGenerateRules: (key: string, rule: GenerateRule) => void;
  setDefaultTokenFormula: (mode: 'formula' | 'manual', operation: string, source: string, param: number) => void;
  recomputeDerivedColor: (key: string) => void;

  // Naming setters (each triggers token regen)
  setNamingNamespace: (ns: string) => void;
  setNamingOrder: (order: string[]) => void;
  setNamingEnabled: (enabled: string[]) => void;
  setNamingValue: (key: string, vals: string[]) => void;

  // Save / Load
  newProject: () => void;
  saveProject: (saveAs?: boolean) => Promise<void>;
  loadProject: (data: ProjectData) => void;

  // Custom tokens (manual additions from Step3)
  addCustomToken: (token: DesignToken) => void;
  removeCustomToken: (id: string) => void;
}

export interface ProjectData {
  version: number;
  projectName?: string;
  baseColors: BaseColors;
  groupOrder: string[];
  groupLabels: Record<string, string>;
  groupDescriptions: Record<string, string>;
  groupEnabled?: Record<string, boolean>;
  namingNamespace: string;
  namingOrder: string[];
  namingEnabled: string[];
  namingValues: Record<string, string[]>;
  namingDescriptions: Record<string, string>;
  defaultNamingDescriptions?: Record<string, string>;
  useOklch: boolean;
  isDark: boolean;
  generateRules: Record<string, GenerateRule>;
  keyGenSettings?: Record<string, KeyColorGenSettings>;
  globalGenerationMode?: 'manual' | 'auto';
  defaultKeyGenSettings?: Record<string, KeyColorGenSettings>;
  defaultGenerateRules?: Record<string, GenerateRule>;
  defaultTokenFormulaMode?: 'formula' | 'manual';
  defaultTokenFormula?: { operation: string; source: string; param: number };
  previewAssignments?: Record<string, string>;
  tokens: DesignToken[];
  customTokens?: DesignToken[];
}

function mergeCustomTokens(freshTokens: DesignToken[], customTokens: DesignToken[]): DesignToken[] {
  if (!customTokens?.length) return freshTokens;
  const byId = new Map<string, DesignToken>();
  for (const t of freshTokens) byId.set(t.id, t);
  for (const c of customTokens) byId.set(c.id, c);
  return Array.from(byId.values());
}

// ── Manual override merge ─────────────────────────────────────────────────────
function mergeManuals(freshTokens: DesignToken[], prevTokens: DesignToken[]): DesignToken[] {
  const manuals = prevTokens.filter(t => t.isManual);
  return freshTokens.map(t => {
    const manual = manuals.find(o => o.id === t.id);
    return manual ? { ...t, color: manual.color, isManual: true } : t;
  });
}

function labelToKey(label: string, existing: string[]): string {
  const base = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'group';
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}${i}`)) i++;
  return `${base}${i}`;
}

// ── Initial naming config ─────────────────────────────────────────────────────
const INIT_NAMING: NamingConfig = {
  namespace: DEFAULT_NAMING_NAMESPACE,
  order:     DEFAULT_NAMING_ORDER,
  enabled:   DEFAULT_NAMING_ENABLED,
  values:    DEFAULT_NAMING_VALUES,
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useColorStore = create<ColorStore>()(
  persist(
    (set, get) => ({
  baseColors: DEFAULT_BASE,
  customTokens: [],
  tokens: mergeCustomTokens(generateTokensFromNaming(DEFAULT_BASE, INIT_NAMING, false, true), []),
  isDark: false,
  useOklch: true,
  generateRules: {},
  keyGenSettings: { ...DEFAULT_KEY_GEN_SETTINGS },
  globalGenerationMode: 'manual',
  defaultKeyGenSettings: { ...DEFAULT_KEY_GEN_SETTINGS },
  defaultGenerateRules: { ...DEFAULT_GENERATE_RULES },
  defaultTokenFormulaMode: 'formula',
  defaultTokenFormula: { operation: 'setLightness', source: 'primary', param: 50 },
  selectedTokenId: null,
  selectedTokenPos: null,
  activePreviewTab: 'home',
  groupOrder: DEFAULT_GROUP_ORDER,
  groupLabels: { ...DEFAULT_GROUP_LABELS },
  groupDescriptions: { ...DEFAULT_GROUP_DESCRIPTIONS },

  namingNamespace: DEFAULT_NAMING_NAMESPACE,
  namingOrder:     DEFAULT_NAMING_ORDER,
  namingEnabled:   DEFAULT_NAMING_ENABLED,
  namingValues:    { ...DEFAULT_NAMING_VALUES },
  namingDescriptions: { ...DEFAULT_NAMING_DESCRIPTIONS },

  // user-adjustable defaults for naming rules (persisted separately from current settings)
  defaultNamingNamespace: DEFAULT_NAMING_NAMESPACE,
  defaultNamingValues:    { ...DEFAULT_NAMING_VALUES },
  defaultNamingDescriptions: { ...DEFAULT_NAMING_DESCRIPTIONS },

  // whether each key color card is active/visible. secondary/tertiary toggles will
  // update these flags; disabled colors are ignored for randomization.
  groupEnabled: {
    primary: true,
    secondary: true,
    tertiary: true,
    neutral: true,
  } as Record<string, boolean>,
  _filterTokensByEnabled: (tokens: any[]) => {
    const enabled = get().groupEnabled;
    return tokens.filter(t => enabled[t.group] ?? true);
  },

  previewAssignments: {},

  projectName: 'Untitled',
  setProjectName: (name) => set({ projectName: name }),

  setPreviewAssignment: (elementId, tokenId) =>
    set(state => ({ previewAssignments: { ...state.previewAssignments, [elementId]: tokenId } })),

  clearPreviewAssignment: (elementId) =>
    set(state => {
      const next = { ...state.previewAssignments };
      delete next[elementId];
      return { previewAssignments: next };
    }),


  setBaseColor: (key, hex) => {
    const baseColors = { ...get().baseColors, [key]: hex };
    let tokens = mergeManuals(
      generateTokensFromNaming(baseColors, makeNamingConfig(get()), get().isDark, get().useOklch),
      get().tokens,
    );
    tokens = get()._filterTokensByEnabled(tokens);
    tokens = mergeCustomTokens(tokens, get().customTokens);
    set({ baseColors, tokens });
  },

  // toggle whether a key color is enabled/visible
  setGroupEnabled: (key: string, enabled: boolean) => {
    set(state => {
      const ge: Record<string, boolean> = { ...state.groupEnabled, [key]: enabled };
      // regenerate tokens to reflect new enabled set
      let tokens = generateTokensFromNaming(state.baseColors, makeNamingConfig(state), state.isDark, state.useOklch);
      // use the updated flags when filtering
      tokens = tokens.filter(t => ge[t.group] ?? true);
      tokens = mergeCustomTokens(tokens, state.customTokens);
      return { groupEnabled: ge, tokens };
    });
  },


  randomizeColors: () => {
    const { groupOrder, baseColors: prev, generateRules, keyGenSettings, groupEnabled } = get();
    const resolved: BaseColors = {};

    console.log('randomizeColors - keyGenSettings:', keyGenSettings);

    // Pass 1: manual + range-auto
    for (const k of groupOrder) {
      if (!groupEnabled[k]) {
        // if disabled, leave previous value untouched
        resolved[k] = prev[k];
        continue;
      }
      const kgs = keyGenSettings[k];
      console.log(`Pass 1 - ${k}:`, kgs);
      if (!kgs || kgs.mode === 'manual') {
        resolved[k] = prev[k] ?? generateRandomColor();
      } else if (kgs.autoSettings.kind === 'range') {
        const rule = (kgs.autoSettings as any).rule ?? generateRules[k] ?? DEFAULT_GENERATE_RULES[k];
        resolved[k] = rule ? generateRandomColorInRange(rule, get().useOklch) : generateRandomColor();
      }
    }

    console.log('After Pass 1 - resolved:', resolved);

    // Pass 2: operation-based auto
    for (const k of groupOrder) {
      const kgs = keyGenSettings[k];
      console.log(`Pass 2 - ${k}:`, kgs, '- kind:', kgs?.autoSettings.kind);
      if (kgs?.mode === 'auto' && kgs.autoSettings.kind === 'operation') {
        const { sourceKey, stage1, operation, param } = kgs.autoSettings as OpGenSettings;
        // stage1 may be undefined (defaults to 'source')
        const fakeRule: any = { stage1: stage1 ?? 'source', operation, source: sourceKey, param, description: '' };
        console.log(`Applying operation ${operation} for ${k} with stage1=${stage1}`);
        resolved[k] = applyRule(fakeRule, { ...resolved }, get().isDark, get().useOklch);
      }
    }

    console.log('After Pass 2 - resolved:', resolved);

    Object.keys(prev).forEach(k => { if (!(k in resolved)) resolved[k] = prev[k]; });
    let tokens = generateTokensFromNaming(resolved, makeNamingConfig(get()), get().isDark, get().useOklch);
    tokens = get()._filterTokensByEnabled(tokens);
    tokens = mergeCustomTokens(tokens, get().customTokens);
    set({ baseColors: resolved, tokens });
  },

  updateToken: (id, patch) => {
    set(state => ({
      tokens: state.tokens.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  },

  resetToken: (id) => {
    const { baseColors, isDark, useOklch } = get();
    const fresh = generateTokensFromNaming(baseColors, makeNamingConfig(get()), isDark, useOklch).find(t => t.id === id);
    if (fresh) {
      set(state => ({ tokens: state.tokens.map(t => t.id === id ? fresh : t) }));
    }
  },

  toggleDark: () => {
    const isDark = !get().isDark;
    const { baseColors } = get();
    const tokens = mergeManuals(
      get()._filterTokensByEnabled(generateTokensFromNaming(baseColors, makeNamingConfig(get()), isDark, get().useOklch)),
      get().tokens,
    );
    set({ isDark, tokens: mergeCustomTokens(tokens, get().customTokens) });
  },

  setSelectedToken: (id, pos) => set({ selectedTokenId: id, selectedTokenPos: pos ?? null }),
  setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),

  exportCSS: () => tokensToCSS(get().tokens),
  exportJSON: () => tokensToJSON(get().tokens),

  setGroupLabel: (key, label) => {
    set(state => ({ groupLabels: { ...state.groupLabels, [key]: label } }));
  },

  // naming defaults actions
  setDefaultNamingNamespace: (ns: string) => {
    set({ defaultNamingNamespace: ns });
  },
  setDefaultNamingValues: (key: string, values: string[]) => {
    set(state => ({ defaultNamingValues: { ...state.defaultNamingValues, [key]: values } }));
  },

  setGroupDescription: (key, desc) => {
    set(state => ({ groupDescriptions: { ...state.groupDescriptions, [key]: desc } }));
  },

  addGroup: (label, hex, desc = '') => {
    const { groupOrder, groupLabels, baseColors, isDark, tokens: prevTokens, keyGenSettings } = get();
    const key = labelToKey(label, Object.keys(baseColors));
    const newBase = { ...baseColors, [key]: hex };
    const newOrder = [...groupOrder, key];
    const newLabels = { ...groupLabels, [key]: label };
    const newDescs = { ...get().groupDescriptions, [key]: desc };
    const newKgs: Record<string, KeyColorGenSettings> = {
      ...keyGenSettings,
      [key]: {
        mode: 'manual',
        autoSettings: { kind: 'range', rule: { ...DEFAULT_GENERATE_RULE } } as KeyColorAutoSettings
      } as KeyColorGenSettings
    };
    let tokens = mergeManuals(
      get()._filterTokensByEnabled(generateTokensFromNaming(newBase, makeNamingConfig(get()), isDark, get().useOklch)),
      prevTokens,
    );
    set({ baseColors: newBase, groupOrder: newOrder, groupLabels: newLabels, tokens, groupDescriptions: newDescs, keyGenSettings: newKgs });
  },

  removeGroup: (key) => {
    const { groupOrder, groupLabels, baseColors, isDark, keyGenSettings } = get();
    const newBase = { ...baseColors };
    delete newBase[key];
    const newOrder = groupOrder.filter(k => k !== key);
    const newLabels = { ...groupLabels };
    delete newLabels[key];
    const newDescs = { ...get().groupDescriptions };
    delete newDescs[key];
    const newKgs = { ...keyGenSettings };
    delete newKgs[key];
    let tokens = generateTokensFromNaming(newBase, makeNamingConfig(get()), isDark, get().useOklch);
    tokens = get()._filterTokensByEnabled(tokens);
    set({ baseColors: newBase, groupOrder: newOrder, groupLabels: newLabels, tokens, groupDescriptions: newDescs, keyGenSettings: newKgs });
  },

  setGenerateRule: (key, rule) => {
    set(state => ({ generateRules: { ...state.generateRules, [key]: rule } }));
  },

  setKeyGenSettings: (key, settings) => {
    set(state => ({ keyGenSettings: { ...state.keyGenSettings, [key]: settings } }));
  },

  setGlobalGenerationMode: (mode) => {
    const { keyGenSettings } = get();
    const updated: Record<string, KeyColorGenSettings> = {};
    for (const [key, kgs] of Object.entries(keyGenSettings)) {
      updated[key] = { ...kgs, mode };
    }
    set({ globalGenerationMode: mode, keyGenSettings: updated });
  },

  setDefaultKeyGenSettings: (key, settings) => {
    set(state => ({ defaultKeyGenSettings: { ...state.defaultKeyGenSettings, [key]: settings } }));
  },

  setDefaultGenerateRules: (key, rule) => {
    set(state => ({ defaultGenerateRules: { ...state.defaultGenerateRules, [key]: rule } }));
  },

  setDefaultTokenFormula: (mode, operation, source, param) => {
    set({
      defaultTokenFormulaMode: mode,
      defaultTokenFormula: { operation, source, param },
    });
  },

  recomputeDerivedColor: (key) => {
    const { keyGenSettings, baseColors, isDark, useOklch } = get();
    const kgs = keyGenSettings[key];
    if (!kgs || kgs.mode === 'manual' || kgs.autoSettings.kind === 'range') return;
    const { sourceKey, stage1, operation, param } = kgs.autoSettings as OpGenSettings;
    const fakeRule: any = { stage1: stage1 ?? 'source', operation, source: sourceKey, param, description: '' };
    const newHex = applyRule(fakeRule, baseColors, isDark, useOklch);
    const newBase = { ...baseColors, [key]: newHex };
    let tokens = generateTokensFromNaming(newBase, makeNamingConfig(get()), isDark, useOklch);
    tokens = get()._filterTokensByEnabled(tokens);
    set({ baseColors: newBase, tokens });
  },

  toggleOklch: () => {
    const useOklch = !get().useOklch;
    const { baseColors, isDark } = get();
    let fresh = generateTokensFromNaming(baseColors, makeNamingConfig(get()), isDark, useOklch);
    fresh = get()._filterTokensByEnabled(fresh);
    const manuals = get().tokens.filter(t => t.isManual);
    const tokens = fresh.map(t => {
      const manual = manuals.find(o => o.id === t.id);
      return manual ? { ...t, color: manual.color, isManual: true } : t;
    });
    set({ useOklch, tokens });
  },

  // ── Save / Load ─────────────────────────────────────────────────────────────
  newProject: () => {
    // reset onboarding flow when creating a new project
    try { localStorage.setItem('introStep', '0'); } catch {}

    const state = get();
    const namingConfig: NamingConfig = {
      namespace: state.defaultNamingNamespace ?? DEFAULT_NAMING_NAMESPACE,
      order:     DEFAULT_NAMING_ORDER,
      enabled:   DEFAULT_NAMING_ENABLED,
      values:    { ...state.defaultNamingValues },
    };
    let tokens = generateTokensFromNaming(DEFAULT_BASE, namingConfig, false, true);
    tokens = get()._filterTokensByEnabled(tokens);
    set({
      projectName: 'Untitled',
      baseColors: { ...DEFAULT_BASE },
      groupOrder: [...DEFAULT_GROUP_ORDER],
      groupLabels: { ...DEFAULT_GROUP_LABELS },
      groupDescriptions: { ...DEFAULT_GROUP_DESCRIPTIONS },
      namingNamespace: state.defaultNamingNamespace ?? DEFAULT_NAMING_NAMESPACE,
      namingOrder: DEFAULT_NAMING_ORDER,
      namingEnabled: DEFAULT_NAMING_ENABLED,
      namingValues: { ...state.defaultNamingValues },
      useOklch: true,
      isDark: false,
      generateRules: {},
      keyGenSettings: { ...DEFAULT_KEY_GEN_SETTINGS },
      globalGenerationMode: 'manual',
      // reset enable flags too
      groupEnabled: {
        primary: true,
        secondary: true,
        tertiary: true,
        neutral: true,
      },
      defaultKeyGenSettings: { ...DEFAULT_KEY_GEN_SETTINGS },
      defaultGenerateRules: { ...DEFAULT_GENERATE_RULES },
      defaultTokenFormulaMode: 'formula',
      defaultTokenFormula: { operation: 'setLightness', source: 'primary', param: 50 },
      previewAssignments: {},
      customTokens: [],
      tokens,
      selectedTokenId: null,
    });
  },

  saveProject: async (saveAs = true) => {
    const s = get();
    const data: ProjectData = {
      version: 1,
      projectName: s.projectName,
      baseColors: s.baseColors,
      groupOrder: s.groupOrder,
      groupLabels: s.groupLabels,
      groupDescriptions: s.groupDescriptions,
      namingNamespace: s.namingNamespace,
      namingOrder: s.namingOrder,
      namingEnabled: s.namingEnabled,
      namingValues: s.namingValues,
      namingDescriptions: s.namingDescriptions,
      defaultNamingDescriptions: s.defaultNamingDescriptions,
      useOklch: s.useOklch,
      isDark: s.isDark,
      generateRules: s.generateRules,
      keyGenSettings: s.keyGenSettings,
      globalGenerationMode: s.globalGenerationMode,
      defaultKeyGenSettings: s.defaultKeyGenSettings,
      defaultGenerateRules: s.defaultGenerateRules,
      defaultTokenFormulaMode: s.defaultTokenFormulaMode,
      defaultTokenFormula: s.defaultTokenFormula,
      previewAssignments: s.previewAssignments,
      tokens: s.tokens,
      customTokens: s.customTokens,
    };
    const json = JSON.stringify(data, null, 2);
    const defaultName = `${get().projectName}.json`;

    // Save As: use File System Access API (native save dialog)
    if (saveAs && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as Window & { showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: defaultName,
          types: [{ description: 'Design System JSON', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }

    // Save (or fallback): direct browser download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
  },

  loadProject: (data: ProjectData) => {
    const nc: NamingConfig = {
      namespace: data.namingNamespace,
      order: data.namingOrder,
      enabled: data.namingEnabled,
      values: data.namingValues,
    };
    // Merge loaded baseColors with defaults to include any new colors
    const mergedBaseColors = { ...DEFAULT_BASE, ...data.baseColors };
    const mergedGroupOrder = DEFAULT_GROUP_ORDER.filter(k => k in mergedBaseColors);
    const mergedGroupLabels = { ...DEFAULT_GROUP_LABELS, ...data.groupLabels };
    const mergedGroupDescriptions = { ...DEFAULT_GROUP_DESCRIPTIONS, ...data.groupDescriptions };

    // Regenerate fresh tokens so formulas are live, then overlay any manual overrides from saved data
    const fresh = generateTokensFromNaming(mergedBaseColors, nc, data.isDark, data.useOklch);
    const tokens = fresh.map(t => {
      const saved = data.tokens.find(s => s.id === t.id);
      if (!saved) return t;
      if (saved.isManual) return { ...t, color: saved.color, isManual: true };
      if (saved.isFormulaOverride) return { ...saved };
      return t;
    });
    const customTokens = data.customTokens ?? [];
    set({
      projectName: data.projectName ?? 'Untitled',
      baseColors: mergedBaseColors,
      groupOrder: mergedGroupOrder,
      groupLabels: mergedGroupLabels,
      groupDescriptions: mergedGroupDescriptions,
      namingNamespace: data.namingNamespace,
      namingOrder: data.namingOrder,
      namingEnabled: data.namingEnabled,
          namingValues: data.namingValues,
      namingDescriptions: data.namingDescriptions ?? DEFAULT_NAMING_DESCRIPTIONS,
      defaultNamingDescriptions: data.defaultNamingDescriptions ?? DEFAULT_NAMING_DESCRIPTIONS,
      useOklch: data.useOklch ?? true,
      isDark: data.isDark ?? false,
      generateRules: data.generateRules ?? {},
      keyGenSettings: data.keyGenSettings ?? { ...DEFAULT_KEY_GEN_SETTINGS },
      globalGenerationMode: data.globalGenerationMode ?? 'manual',
      groupEnabled: data.groupEnabled ?? {
        primary: true,
        secondary: true,
        tertiary: true,
        neutral: true,
      },
      defaultKeyGenSettings: data.defaultKeyGenSettings ?? { ...DEFAULT_KEY_GEN_SETTINGS },
      defaultGenerateRules: data.defaultGenerateRules ?? { ...DEFAULT_GENERATE_RULES },
      defaultTokenFormulaMode: data.defaultTokenFormulaMode ?? 'formula',
      defaultTokenFormula: data.defaultTokenFormula ?? { operation: 'setLightness', source: 'primary', param: 50 },
      previewAssignments: data.previewAssignments ?? {},
      customTokens,
      tokens: mergeCustomTokens(tokens, customTokens),
      selectedTokenId: null,
    });
  },

  // ── Naming setters ──────────────────────────────────────────────────────────
  setNamingNamespace: (ns) => {
    const nc = { ...makeNamingConfig(get()), namespace: ns };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingNamespace: ns, tokens: mergeCustomTokens(tokens, get().customTokens) });
  },

  setNamingOrder: (order) => {
    const nc = { ...makeNamingConfig(get()), order };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingOrder: order, tokens: mergeCustomTokens(tokens, get().customTokens) });
  },

  setNamingEnabled: (enabled) => {
    const nc = { ...makeNamingConfig(get()), enabled };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingEnabled: enabled, tokens: mergeCustomTokens(tokens, get().customTokens) });
  },

  setNamingValue: (key, vals) => {
    const namingValues = { ...get().namingValues, [key]: vals };
    const nc = { ...makeNamingConfig(get()), values: namingValues };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingValues, tokens: mergeCustomTokens(tokens, get().customTokens) });
  },
  setNamingDescription: (key, desc) => {
    set(state => ({ namingDescriptions: { ...state.namingDescriptions, [key]: desc } }));
  },
  setDefaultNamingDescriptions: (key, desc) => {
    set(state => ({ defaultNamingDescriptions: { ...state.defaultNamingDescriptions, [key]: desc } }));
  },

  addCustomToken: (token) => {
    set(state => {
      const customTokens = mergeCustomTokens([], [...state.customTokens, token]);
      const tokens = mergeCustomTokens(state.tokens, customTokens);
      return { customTokens, tokens };
    });
  },

  removeCustomToken: (id) => {
    set(state => {
      const customTokens = state.customTokens.filter(t => t.id !== id);
      const tokens = mergeCustomTokens(
        generateTokensFromNaming(state.baseColors, makeNamingConfig(state), state.isDark, state.useOklch),
        customTokens
      );
      return { customTokens, tokens };
    });
  },
    }),
    {
      name: 'color-store',
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => {
          try { localStorage.setItem(name, JSON.stringify(value)); } catch { /* quota exceeded */ }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// ── Convenience hook ──────────────────────────────────────────────────────────
export function useTokenMap(): Record<string, string> {
  const tokens = useColorStore(s => s.tokens);
  return Object.fromEntries(tokens.map(t => [t.id, t.color]));
}
