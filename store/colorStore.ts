'use client';

import { create } from 'zustand';
import { BaseColors, DesignToken, PreviewTab } from '@/types/tokens';
import { generateTokens, tokensToCSS, tokensToJSON, applyRule } from '@/lib/generateTokens';
import { generateRandomColor } from '@/lib/colorUtils';

const DEFAULT_BASE: BaseColors = {
  primary:   '#6750a4',
  secondary: '#625b71',
  tertiary:  '#7d5260',
  neutral:   '#605d64',
};

const DEFAULT_GROUP_ORDER = ['primary', 'secondary', 'tertiary', 'neutral'];

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

interface ColorStore {
  baseColors: BaseColors;
  tokens: DesignToken[];
  isDark: boolean;
  selectedTokenId: string | null;
  activePreviewTab: PreviewTab;
  groupOrder: string[];
  groupLabels: Record<string, string>;
  groupDescriptions: Record<string, string>;

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
  useOklch: boolean;
  toggleOklch: () => void;
}

/** Re-apply manual/formula overrides onto freshly-generated tokens */
function mergeOverrides(
  freshTokens: DesignToken[],
  prevTokens: DesignToken[],
  baseColors: BaseColors,
  isDark: boolean,
  useOklch = false,
): DesignToken[] {
  const manuals = prevTokens.filter(t => t.isManual);
  const formulas = prevTokens.filter(t => t.isFormulaOverride && !t.isManual);
  return freshTokens.map(t => {
    const manual = manuals.find(o => o.id === t.id);
    if (manual) return { ...t, color: manual.color, isManual: true };
    const formula = formulas.find(o => o.id === t.id);
    if (formula) {
      const newColor = applyRule(formula.rule, baseColors, isDark, useOklch);
      return { ...t, rule: formula.rule, name: formula.name, color: newColor, isFormulaOverride: true };
    }
    return t;
  });
}

/** Slugify a label to a safe unique key */
function labelToKey(label: string, existing: string[]): string {
  const base = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'group';
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}${i}`)) i++;
  return `${base}${i}`;
}

export const useColorStore = create<ColorStore>((set, get) => ({
  baseColors: DEFAULT_BASE,
  tokens: generateTokens(DEFAULT_BASE, false, true),
  isDark: false,
  useOklch: true,
  selectedTokenId: null,
  activePreviewTab: 'components',
  groupOrder: DEFAULT_GROUP_ORDER,
  groupLabels: { ...DEFAULT_GROUP_LABELS },
  groupDescriptions: { ...DEFAULT_GROUP_DESCRIPTIONS },

  setBaseColor: (key, hex) => {
    const baseColors = { ...get().baseColors, [key]: hex };
    const tokens = mergeOverrides(
      generateTokens(baseColors, get().isDark, get().useOklch),
      get().tokens,
      baseColors,
      get().isDark,
      get().useOklch,
    );
    set({ baseColors, tokens });
  },

  randomizeColors: () => {
    const { groupOrder, baseColors: prev } = get();
    const baseColors: BaseColors = Object.fromEntries(
      groupOrder.map(k => [k, generateRandomColor()])
    );
    // preserve extra keys not in groupOrder (shouldn't happen but safety)
    Object.keys(prev).forEach(k => { if (!(k in baseColors)) baseColors[k] = prev[k]; });
    const tokens = generateTokens(baseColors, get().isDark, get().useOklch);
    set({ baseColors, tokens });
  },

  updateToken: (id, patch) => {
    set(state => ({
      tokens: state.tokens.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  },

  resetToken: (id) => {
    const { baseColors, isDark } = get();
    const fresh = generateTokens(baseColors, isDark, get().useOklch).find(t => t.id === id);
    if (fresh) {
      set(state => ({ tokens: state.tokens.map(t => t.id === id ? fresh : t) }));
    }
  },

  toggleDark: () => {
    const isDark = !get().isDark;
    const { baseColors } = get();
    const tokens = mergeOverrides(
      generateTokens(baseColors, isDark, get().useOklch),
      get().tokens,
      baseColors,
      isDark,
      get().useOklch,
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
    const { groupOrder, groupLabels, baseColors, isDark, tokens: prevTokens } = get();
    const key = labelToKey(label, Object.keys(baseColors));
    const newBase = { ...baseColors, [key]: hex };
    const newOrder = [...groupOrder, key];
    const newLabels = { ...groupLabels, [key]: label };
    const newDescs = { ...get().groupDescriptions, [key]: desc };
    const tokens = mergeOverrides(
      generateTokens(newBase, isDark, get().useOklch),
      prevTokens,
      newBase,
      isDark,
      get().useOklch,
    );
    set({ baseColors: newBase, groupOrder: newOrder, groupLabels: newLabels, tokens, groupDescriptions: newDescs });
  },

  removeGroup: (key) => {
    const { groupOrder, groupLabels, baseColors, isDark } = get();
    const newBase = { ...baseColors };
    delete newBase[key];
    const newOrder = groupOrder.filter(k => k !== key);
    const newLabels = { ...groupLabels };
    delete newLabels[key];
    const newDescs = { ...get().groupDescriptions };
    delete newDescs[key];
    const tokens = generateTokens(newBase, isDark, get().useOklch);
    set({ baseColors: newBase, groupOrder: newOrder, groupLabels: newLabels, tokens, groupDescriptions: newDescs });
  },

  toggleOklch: () => {
    const useOklch = !get().useOklch;
    const { baseColors, isDark } = get();
    // Fresh OKLCH generation for ALL derived tokens.
    // Only preserve manually-pinned colors; formula overrides also get fresh values
    // so every derived token is recalculated with the correct color math.
    const fresh = generateTokens(baseColors, isDark, useOklch);
    const manuals = get().tokens.filter(t => t.isManual);
    const tokens = fresh.map(t => {
      const manual = manuals.find(o => o.id === t.id);
      return manual ? { ...t, color: manual.color, isManual: true } : t;
    });
    set({ useOklch, tokens });
  },
}));

// Convenience: token lookup map
export function useTokenMap(): Record<string, string> {
  const tokens = useColorStore(s => s.tokens);
  return Object.fromEntries(tokens.map(t => [t.id, t.color]));
}
