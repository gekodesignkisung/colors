'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BaseColors, DesignToken, PreviewTab, GenerateRule, KeyColorGenSettings, KeyColorAutoSettings, OpGenSettings } from '@/types/tokens';
import { generateTokensFromNaming, NamingConfig, tokensToCSS, tokensToJSON, applyRule } from '@/lib/generateTokens';
import { generateRandomColor, generateRandomColorInRange } from '@/lib/colorUtils';

// ── Base colors ───────────────────────────────────────────────────────────────
const DEFAULT_BASE: BaseColors = {
  primary:   '#6750a4',
  secondary: '#625b71',
  tertiary:  '#7d5260',
  neutral:   '#605d64',
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
    autoSettings: { kind: 'operation', sourceKey: 'primary', operation: 'colorShift', param: 60 } as KeyColorAutoSettings,
  },
  tertiary: {
    mode: 'auto',
    autoSettings: { kind: 'operation', sourceKey: 'primary', operation: 'colorShift', param: 120 } as KeyColorAutoSettings,
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
  isDark: boolean;
  selectedTokenId: string | null;
  activePreviewTab: PreviewTab;
  groupOrder: string[];
  groupLabels: Record<string, string>;
  groupDescriptions: Record<string, string>;
  useOklch: boolean;
  generateRules: Record<string, GenerateRule>;
  keyGenSettings: Record<string, KeyColorGenSettings>;
  globalGenerationMode: 'manual' | 'auto';
  defaultKeyGenSettings: Record<string, KeyColorGenSettings>;
  defaultGenerateRules: Record<string, GenerateRule>;
  defaultTokenFormulaMode: 'formula' | 'manual';
  defaultTokenFormula: { operation: string; source: string; param: number };

  // Naming config
  namingNamespace: string;
  namingOrder: string[];
  namingEnabled: string[];
  namingValues: Record<string, string[]>;

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
  setSelectedToken: (id: string | null) => void;
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
}

export interface ProjectData {
  version: number;
  projectName?: string;
  baseColors: BaseColors;
  groupOrder: string[];
  groupLabels: Record<string, string>;
  groupDescriptions: Record<string, string>;
  namingNamespace: string;
  namingOrder: string[];
  namingEnabled: string[];
  namingValues: Record<string, string[]>;
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
  tokens: generateTokensFromNaming(DEFAULT_BASE, INIT_NAMING, false, true),
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
  activePreviewTab: 'home',
  groupOrder: DEFAULT_GROUP_ORDER,
  groupLabels: { ...DEFAULT_GROUP_LABELS },
  groupDescriptions: { ...DEFAULT_GROUP_DESCRIPTIONS },

  namingNamespace: DEFAULT_NAMING_NAMESPACE,
  namingOrder:     DEFAULT_NAMING_ORDER,
  namingEnabled:   DEFAULT_NAMING_ENABLED,
  namingValues:    { ...DEFAULT_NAMING_VALUES },

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
    const tokens = mergeManuals(
      generateTokensFromNaming(baseColors, makeNamingConfig(get()), get().isDark, get().useOklch),
      get().tokens,
    );
    set({ baseColors, tokens });
  },

  randomizeColors: () => {
    const { groupOrder, baseColors: prev, generateRules, keyGenSettings } = get();
    const resolved: BaseColors = {};

    console.log('randomizeColors - keyGenSettings:', keyGenSettings);

    // Pass 1: manual + range-auto
    for (const k of groupOrder) {
      const kgs = keyGenSettings[k];
      console.log(`Pass 1 - ${k}:`, kgs);
      if (!kgs || kgs.mode === 'manual') {
        resolved[k] = prev[k] ?? generateRandomColor();
      } else if (kgs.autoSettings.kind === 'range') {
        const rule = (kgs.autoSettings as any).rule ?? generateRules[k] ?? DEFAULT_GENERATE_RULES[k];
        resolved[k] = rule ? generateRandomColorInRange(rule) : generateRandomColor();
      }
    }

    console.log('After Pass 1 - resolved:', resolved);

    // Pass 2: operation-based auto
    for (const k of groupOrder) {
      const kgs = keyGenSettings[k];
      console.log(`Pass 2 - ${k}:`, kgs, '- kind:', kgs?.autoSettings.kind);
      if (kgs?.mode === 'auto' && kgs.autoSettings.kind === 'operation') {
        const { sourceKey, operation, param } = kgs.autoSettings as OpGenSettings;
        const fakeRule: any = { operation, source: sourceKey, param, description: '' };
        console.log(`Applying operation ${operation} for ${k}`);
        resolved[k] = applyRule(fakeRule, { ...resolved }, get().isDark, get().useOklch);
      }
    }

    console.log('After Pass 2 - resolved:', resolved);

    Object.keys(prev).forEach(k => { if (!(k in resolved)) resolved[k] = prev[k]; });
    const tokens = generateTokensFromNaming(resolved, makeNamingConfig(get()), get().isDark, get().useOklch);
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
      generateTokensFromNaming(baseColors, makeNamingConfig(get()), isDark, get().useOklch),
      get().tokens,
    );
    set({ isDark, tokens });
  },

  setSelectedToken: (id) => set({ selectedTokenId: id }),
  setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),

  exportCSS: () => tokensToCSS(get().tokens),
  exportJSON: () => tokensToJSON(get().tokens),

  setGroupLabel: (key, label) => {
    set(state => ({ groupLabels: { ...state.groupLabels, [key]: label } }));
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
    const tokens = mergeManuals(
      generateTokensFromNaming(newBase, makeNamingConfig(get()), isDark, get().useOklch),
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
    const tokens = generateTokensFromNaming(newBase, makeNamingConfig(get()), isDark, get().useOklch);
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
    const { sourceKey, operation, param } = kgs.autoSettings as OpGenSettings;
    const fakeRule: any = { operation, source: sourceKey, param, description: '' };
    const newHex = applyRule(fakeRule, baseColors, isDark, useOklch);
    const newBase = { ...baseColors, [key]: newHex };
    const tokens = generateTokensFromNaming(newBase, makeNamingConfig(get()), isDark, useOklch);
    set({ baseColors: newBase, tokens });
  },

  toggleOklch: () => {
    const useOklch = !get().useOklch;
    const { baseColors, isDark } = get();
    const fresh = generateTokensFromNaming(baseColors, makeNamingConfig(get()), isDark, useOklch);
    const manuals = get().tokens.filter(t => t.isManual);
    const tokens = fresh.map(t => {
      const manual = manuals.find(o => o.id === t.id);
      return manual ? { ...t, color: manual.color, isManual: true } : t;
    });
    set({ useOklch, tokens });
  },

  // ── Save / Load ─────────────────────────────────────────────────────────────
  newProject: () => {
    const tokens = generateTokensFromNaming(DEFAULT_BASE, INIT_NAMING, false, true);
    set({
      projectName: 'Untitled',
      baseColors: { ...DEFAULT_BASE },
      groupOrder: [...DEFAULT_GROUP_ORDER],
      groupLabels: { ...DEFAULT_GROUP_LABELS },
      groupDescriptions: { ...DEFAULT_GROUP_DESCRIPTIONS },
      namingNamespace: DEFAULT_NAMING_NAMESPACE,
      namingOrder: DEFAULT_NAMING_ORDER,
      namingEnabled: DEFAULT_NAMING_ENABLED,
      namingValues: { ...DEFAULT_NAMING_VALUES },
      useOklch: true,
      isDark: false,
      generateRules: {},
      keyGenSettings: { ...DEFAULT_KEY_GEN_SETTINGS },
      globalGenerationMode: 'manual',
      defaultKeyGenSettings: { ...DEFAULT_KEY_GEN_SETTINGS },
      defaultGenerateRules: { ...DEFAULT_GENERATE_RULES },
      defaultTokenFormulaMode: 'formula',
      defaultTokenFormula: { operation: 'setLightness', source: 'primary', param: 50 },
      previewAssignments: {},
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
      useOklch: data.useOklch ?? true,
      isDark: data.isDark ?? false,
      generateRules: data.generateRules ?? {},
      keyGenSettings: data.keyGenSettings ?? { ...DEFAULT_KEY_GEN_SETTINGS },
      globalGenerationMode: data.globalGenerationMode ?? 'manual',
      defaultKeyGenSettings: data.defaultKeyGenSettings ?? { ...DEFAULT_KEY_GEN_SETTINGS },
      defaultGenerateRules: data.defaultGenerateRules ?? { ...DEFAULT_GENERATE_RULES },
      defaultTokenFormulaMode: data.defaultTokenFormulaMode ?? 'formula',
      defaultTokenFormula: data.defaultTokenFormula ?? { operation: 'setLightness', source: 'primary', param: 50 },
      previewAssignments: data.previewAssignments ?? {},
      tokens,
      selectedTokenId: null,
    });
  },

  // ── Naming setters ──────────────────────────────────────────────────────────
  setNamingNamespace: (ns) => {
    const nc = { ...makeNamingConfig(get()), namespace: ns };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingNamespace: ns, tokens });
  },

  setNamingOrder: (order) => {
    const nc = { ...makeNamingConfig(get()), order };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingOrder: order, tokens });
  },

  setNamingEnabled: (enabled) => {
    const nc = { ...makeNamingConfig(get()), enabled };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingEnabled: enabled, tokens });
  },

  setNamingValue: (key, vals) => {
    const namingValues = { ...get().namingValues, [key]: vals };
    const nc = { ...makeNamingConfig(get()), values: namingValues };
    const tokens = generateTokensFromNaming(get().baseColors, nc, get().isDark, get().useOklch);
    set({ namingValues, tokens });
  },
    }),
    {
      name: 'color-store',
    }
  )
);

// ── Convenience hook ──────────────────────────────────────────────────────────
export function useTokenMap(): Record<string, string> {
  const tokens = useColorStore(s => s.tokens);
  return Object.fromEntries(tokens.map(t => [t.id, t.color]));
}
