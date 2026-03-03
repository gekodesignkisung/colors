'use client';

import { create } from 'zustand';
import { BaseColors, DesignToken, PreviewTab } from '@/types/tokens';
import { generateTokens, tokensToCSS, tokensToJSON } from '@/lib/generateTokens';
import { generateRandomColor } from '@/lib/colorUtils';

const DEFAULT_BASE: BaseColors = {
  primary:   '#6750A4',
  secondary: '#625B71',
  tertiary:  '#7D5260',
  neutral:   '#605D64',
};

interface ColorStore {
  baseColors: BaseColors;
  tokens: DesignToken[];
  isDark: boolean;
  selectedTokenId: string | null;
  activePreviewTab: PreviewTab;

  setBaseColor: (key: keyof BaseColors, hex: string) => void;
  randomizeColors: () => void;
  updateToken: (id: string, patch: Partial<Pick<DesignToken, 'name' | 'color' | 'isManual' | 'rule'>>) => void;
  resetToken: (id: string) => void;
  toggleDark: () => void;
  setSelectedToken: (id: string | null) => void;
  setActivePreviewTab: (tab: PreviewTab) => void;
  exportCSS: () => string;
  exportJSON: () => Record<string, string>;
}

export const useColorStore = create<ColorStore>((set, get) => ({
  baseColors: DEFAULT_BASE,
  tokens: generateTokens(DEFAULT_BASE, false),
  isDark: false,
  selectedTokenId: null,
  activePreviewTab: 'components',

  setBaseColor: (key, hex) => {
    const baseColors = { ...get().baseColors, [key]: hex };
    const manualOverrides = get().tokens.filter(t => t.isManual);
    const freshTokens = generateTokens(baseColors, get().isDark);
    // Re-apply manual overrides
    const tokens = freshTokens.map(t => {
      const override = manualOverrides.find(o => o.id === t.id);
      return override ? { ...t, color: override.color, isManual: true } : t;
    });
    set({ baseColors, tokens });
  },

  randomizeColors: () => {
    const baseColors: BaseColors = {
      primary:   generateRandomColor(),
      secondary: generateRandomColor(),
      tertiary:  generateRandomColor(),
      neutral:   generateRandomColor(),
    };
    const tokens = generateTokens(baseColors, get().isDark);
    set({ baseColors, tokens });
  },

  updateToken: (id, patch) => {
    set(state => ({
      tokens: state.tokens.map(t =>
        t.id === id ? { ...t, ...patch } : t
      ),
    }));
  },

  resetToken: (id) => {
    const { baseColors, isDark } = get();
    const fresh = generateTokens(baseColors, isDark).find(t => t.id === id);
    if (fresh) {
      set(state => ({
        tokens: state.tokens.map(t => t.id === id ? fresh : t),
      }));
    }
  },

  toggleDark: () => {
    const isDark = !get().isDark;
    const { baseColors } = get();
    const manualOverrides = get().tokens.filter(t => t.isManual);
    const freshTokens = generateTokens(baseColors, isDark);
    const tokens = freshTokens.map(t => {
      const override = manualOverrides.find(o => o.id === t.id);
      return override ? { ...t, color: override.color, isManual: true } : t;
    });
    set({ isDark, tokens });
  },

  setSelectedToken: (id) => set({ selectedTokenId: id }),
  setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),

  exportCSS: () => tokensToCSS(get().tokens),
  exportJSON: () => tokensToJSON(get().tokens),
}));

// Convenience: token lookup map
export function useTokenMap(): Record<string, string> {
  const tokens = useColorStore(s => s.tokens);
  return Object.fromEntries(tokens.map(t => [t.id, t.color]));
}
