import { BaseColors, DesignToken, TokenGroup, TokenRule, OpGenSettings } from '@/types/tokens';
import {
  hexToHSL, hslToHex, getOnColor, getOnColorOKLCH, setLightness, setSaturation, lighten, darken,
  hexToOKLCH, oklchToHex, setLightnessOKLCH, lightenOKLCH, darkenOKLCH,
  setSaturationOKLCH, colorShiftOKLCH, invertOKLCH, grayscaleHSL, grayscaleOKLCH,
} from './colorUtils';

function makeToken(
  id: string,
  name: string,
  group: TokenGroup,
  color: string,
  rule: TokenRule
): DesignToken {
  return { id, name, group, color, rule, isManual: false };
}

// ── Naming-based generation helpers ───────────────────────────────────────────

function getVariantBaseColor(variant: string, base: BaseColors, isDark: boolean, useOklch: boolean): string {
  const raw = base[variant] ?? (variant === 'danger' ? (isDark ? '#FFB4AB' : '#B3261E') : (base.primary ?? '#6750a4'));
  if (!isDark) return raw;
  if (useOklch) {
    const ok = hexToOKLCH(raw);
    return oklchToHex(Math.min(ok.l + 0.12, 0.87), ok.c, ok.h);
  }
  const { h, s, l } = hexToHSL(raw);
  return hslToHex(h, Math.min(s, 80), Math.min(l + 15, 85));
}

function applyStateModifier(hex: string, state: string, useOklch: boolean): string {
  if (state === 'hover')   return useOklch ? lightenOKLCH(hex, 8)  : lighten(hex, 8);
  if (state === 'pressed') return useOklch ? darkenOKLCH(hex, 10)  : darken(hex, 10);
  if (state === 'disabled') {
    if (useOklch) {
      const { l, h } = hexToOKLCH(hex);
      return oklchToHex(l > 0.5 ? 0.75 : 0.35, 0.02, h);
    }
    const { h, l } = hexToHSL(hex);
    return hslToHex(h, 8, l > 50 ? 70 : 45);
  }
  return hex;
}

function deriveTypeColor(hex: string, type: string, useOklch: boolean): string {
  if (type === 'text' || type === 'icon') return useOklch ? getOnColorOKLCH(hex) : getOnColor(hex);
  if (type === 'border') {
    if (useOklch) {
      const { l, c, h } = hexToOKLCH(hex);
      return oklchToHex(l * 0.85, Math.min(c * 0.7, 0.15), h);
    }
    const { h, s, l } = hexToHSL(hex);
    return hslToHex(h, Math.min(s * 0.7, 50), l * 0.85);
  }
  return hex; // background
}

export interface NamingConfig {
  namespace: string;
  order: string[];
  enabled: string[];
  values: Record<string, string[]>;
}

export function generateTokensFromNaming(
  base: BaseColors,
  config: NamingConfig,
  isDark: boolean,
  useOklch: boolean
): DesignToken[] {
  const enabledSet = new Set(config.enabled);
  const GENERATIVE = ['variant', 'type', 'state'];
  const activeDims = config.order.filter(k => GENERATIVE.includes(k) && enabledSet.has(k));

  const variants = (enabledSet.has('variant') && config.values.variant?.length) ? config.values.variant : ['primary'];
  const types    = (enabledSet.has('type')    && config.values.type?.length)    ? config.values.type    : ['background'];
  const states   = (enabledSet.has('state')   && config.values.state?.length)   ? config.values.state   : ['default'];
  const useNs    = enabledSet.has('namespace') && !!config.namespace;

  const tokens: DesignToken[] = [];
  for (const variant of variants) {
    const variantBase = getVariantBaseColor(variant, base, isDark, useOklch);
    for (const state of states) {
      const statedColor = applyStateModifier(variantBase, state, useOklch);
      for (const type of types) {
        const finalColor = deriveTypeColor(statedColor, type, useOklch);
        const parts = activeDims.map(k =>
          k === 'variant' ? variant : k === 'type' ? type : k === 'state' ? state : ''
        ).filter(Boolean);
        const id = useNs ? `${config.namespace}.${parts.join('.')}` : parts.join('.');
        const stateAmt = state === 'hover' ? 8 : state === 'pressed' ? 10 : undefined;
        tokens.push(makeToken(id, id, variant, finalColor, {
          operation: 'source',
          source: variant,
          description: '',
          namingVariant: variant,
          namingState: state,
          namingType: type,
          stateAmount: stateAmt,
        }));
      }
    }
  }
  return tokens;
}

// ── Naming-based derivation helpers (exported for UI use) ────────────────────

export function getStateDescription(state: string, amount?: number): string {
  if (state === 'hover')    return `Lighten +${amount ?? 8}%`;
  if (state === 'pressed')  return `Darken −${amount ?? 10}%`;
  if (state === 'disabled') return 'Desaturate (disabled)';
  return 'No modification';
}

export function getTypeDescription(type: string): string {
  if (type === 'text' || type === 'icon') return 'Contrast (WCAG auto)';
  if (type === 'border') return 'Muted (−15% L, −30% C)';
  return 'Source color';
}

export function computeNamingTokenColor(
  variant: string, state: string, type: string,
  base: BaseColors, isDark: boolean, useOklch: boolean,
  stateAmount?: number,
): string {
  const variantBase = getVariantBaseColor(variant, base, isDark, useOklch);
  let statedColor = variantBase;
  if (state === 'hover') {
    const amt = stateAmount ?? 8;
    statedColor = useOklch ? lightenOKLCH(variantBase, amt) : lighten(variantBase, amt);
  } else if (state === 'pressed') {
    const amt = stateAmount ?? 10;
    statedColor = useOklch ? darkenOKLCH(variantBase, amt) : darken(variantBase, amt);
  } else if (state === 'disabled') {
    statedColor = applyStateModifier(variantBase, 'disabled', useOklch);
  }
  return deriveTypeColor(statedColor, type, useOklch);
}

// Generate a tonal container: preserve hue, reduce saturation, push to high lightness
function makeContainer(hex: string, lightL = 90, darkMode = false, useOklch = false): string {
  if (useOklch) {
    const { c, h } = hexToOKLCH(hex);
    // Light: L=0.88 (allows more visible chroma than 0.92), retain 85% chroma
    // Dark:  L=0.30, retain 70% chroma
    const targetL = darkMode ? 0.30 : 0.88;
    const targetC = darkMode ? Math.min(c * 0.70, 0.16) : Math.min(c * 0.85, 0.25);
    return oklchToHex(targetL, targetC, h);
  }
  const { h, s } = hexToHSL(hex);
  const targetL = darkMode ? 25 : lightL;
  const targetS = darkMode ? Math.min(s * 0.6, 40) : Math.min(s * 0.5, 50);
  return hslToHex(h, targetS, targetL);
}

// onContainer: same hue, high saturation, dark/light depending on container
function makeOnContainer(hex: string, darkMode = false, useOklch = false): string {
  if (useOklch) {
    const { c, h } = hexToOKLCH(hex);
    // Light: L=0.15 dark text (retain 90% chroma — clearly tinted)
    // Dark:  L=0.90 light text (retain 80% chroma)
    const targetL = darkMode ? 0.90 : 0.15;
    const targetC = Math.min(c * (darkMode ? 0.80 : 0.90), 0.20);
    return oklchToHex(targetL, targetC, h);
  }
  const { h, s } = hexToHSL(hex);
  const targetL = darkMode ? 90 : 10;
  return hslToHex(h, Math.min(s * 0.8, 80), targetL);
}

export function generateTokens(base: BaseColors, isDark = false, useOklch = false): DesignToken[] {
  // OKLCH ON: 모든 base 색을 OKLCH 라운드트립 처리
  // → sRGB 내 색상은 동일, out-of-gamut은 gamut-clipped hex로 변환
  // 이후 모든 파생 계산은 src.* 기준으로 수행
  const src: BaseColors = useOklch
    ? (Object.fromEntries(
        Object.entries(base).map(([k, v]) => {
          const { l, c, h } = hexToOKLCH(v as string);
          return [k, oklchToHex(l, c, h)];
        })
      ) as BaseColors)
    : base;

  // Primary
  const primary = (() => {
    if (!isDark) return src.primary;
    if (useOklch) { const ok = hexToOKLCH(src.primary); return oklchToHex(Math.min(ok.l + 0.12, 0.87), ok.c, ok.h); }
    const p = hexToHSL(src.primary); return hslToHex(p.h, Math.min(p.s, 80), Math.min(p.l + 15, 85));
  })();
  const onPrimary = useOklch ? getOnColorOKLCH(primary) : getOnColor(primary);
  const primaryContainer = makeContainer(src.primary, 90, isDark, useOklch);
  const onPrimaryContainer = makeOnContainer(src.primary, isDark, useOklch);

  // Secondary
  const secondary = (() => {
    if (!isDark) return src.secondary;
    if (useOklch) { const ok = hexToOKLCH(src.secondary); return oklchToHex(Math.min(ok.l + 0.12, 0.85), ok.c, ok.h); }
    const s = hexToHSL(src.secondary); return hslToHex(s.h, Math.min(s.s, 70), Math.min(s.l + 15, 80));
  })();
  const onSecondary = useOklch ? getOnColorOKLCH(secondary) : getOnColor(secondary);
  const secondaryContainer = makeContainer(src.secondary, 90, isDark, useOklch);
  const onSecondaryContainer = makeOnContainer(src.secondary, isDark, useOklch);

  // Tertiary
  const tertiary = (() => {
    if (!isDark) return src.tertiary;
    if (useOklch) { const ok = hexToOKLCH(src.tertiary); return oklchToHex(Math.min(ok.l + 0.12, 0.85), ok.c, ok.h); }
    const t = hexToHSL(src.tertiary); return hslToHex(t.h, Math.min(t.s, 70), Math.min(t.l + 15, 80));
  })();
  const onTertiary = useOklch ? getOnColorOKLCH(tertiary) : getOnColor(tertiary);
  const tertiaryContainer = makeContainer(src.tertiary, 90, isDark, useOklch);
  const onTertiaryContainer = makeOnContainer(src.tertiary, isDark, useOklch);

  // Surface tones (from neutral hue)
  let background: string, onBackground: string,
      surface: string, surfaceVariant: string, onSurface: string, onSurfaceVariant: string,
      surfaceContainerLowest: string, surfaceContainerLow: string, surfaceContainer: string,
      surfaceContainerHigh: string, surfaceContainerHighest: string,
      outline: string, outlineVariant: string;

  if (useOklch) {
    const nOk = hexToOKLCH(src.neutral);
    const nH = nOk.h;
    const nC  = Math.min(nOk.c * 0.25, 0.015);   // subtle tint for neutral surfaces
    const nCs = Math.min(nOk.c * 0.45, 0.030);   // slightly more for variants/outlines
    background             = isDark ? oklchToHex(0.10,  nC,  nH) : oklchToHex(0.997, nC,  nH);
    onBackground           = isDark ? oklchToHex(0.92,  nC,  nH) : oklchToHex(0.15,  nC,  nH);
    surface                = isDark ? oklchToHex(0.12,  nC,  nH) : oklchToHex(0.985, nC,  nH);
    surfaceVariant         = isDark ? oklchToHex(0.32,  nCs, nH) : oklchToHex(0.92,  nCs, nH);
    onSurface              = isDark ? oklchToHex(0.90,  nC,  nH) : oklchToHex(0.15,  nC,  nH);
    onSurfaceVariant       = isDark ? oklchToHex(0.82,  nCs, nH) : oklchToHex(0.32,  nCs, nH);
    surfaceContainerLowest = isDark ? oklchToHex(0.07,  nC,  nH) : oklchToHex(1.0,   nC,  nH);
    surfaceContainerLow    = isDark ? oklchToHex(0.14,  nC,  nH) : oklchToHex(0.97,  nC,  nH);
    surfaceContainer       = isDark ? oklchToHex(0.16,  nC,  nH) : oklchToHex(0.955, nC,  nH);
    surfaceContainerHigh   = isDark ? oklchToHex(0.20,  nC,  nH) : oklchToHex(0.94,  nC,  nH);
    surfaceContainerHighest= isDark ? oklchToHex(0.24,  nC,  nH) : oklchToHex(0.92,  nC,  nH);
    outline                = oklchToHex(isDark ? 0.65 : 0.55, nCs, nH);
    outlineVariant         = oklchToHex(isDark ? 0.32 : 0.83, nCs, nH);
  } else {
    const n = hexToHSL(src.neutral);
    const neutralH = n.h;
    const neutralS = Math.min(n.s * 0.2, 10);
    background             = isDark ? hslToHex(neutralH, neutralS, 6)   : hslToHex(neutralH, neutralS, 99);
    onBackground           = isDark ? hslToHex(neutralH, neutralS, 90)  : hslToHex(neutralH, neutralS, 10);
    surface                = isDark ? hslToHex(neutralH, neutralS, 8)   : hslToHex(neutralH, neutralS, 98);
    surfaceVariant         = isDark ? hslToHex(neutralH, Math.min(n.s*0.3,15), 30) : hslToHex(neutralH, Math.min(n.s*0.3,15), 90);
    onSurface              = isDark ? hslToHex(neutralH, neutralS, 90)  : hslToHex(neutralH, neutralS, 10);
    onSurfaceVariant       = isDark ? hslToHex(neutralH, Math.min(n.s*0.4,20), 80) : hslToHex(neutralH, Math.min(n.s*0.4,20), 30);
    surfaceContainerLowest = isDark ? hslToHex(neutralH, neutralS, 4)   : hslToHex(neutralH, neutralS, 100);
    surfaceContainerLow    = isDark ? hslToHex(neutralH, neutralS, 10)  : hslToHex(neutralH, neutralS, 96);
    surfaceContainer       = isDark ? hslToHex(neutralH, neutralS, 12)  : hslToHex(neutralH, neutralS, 94);
    surfaceContainerHigh   = isDark ? hslToHex(neutralH, neutralS, 17)  : hslToHex(neutralH, neutralS, 92);
    surfaceContainerHighest= isDark ? hslToHex(neutralH, neutralS, 22)  : hslToHex(neutralH, neutralS, 90);
    outline                = hslToHex(neutralH, Math.min(n.s*0.4,20), isDark ? 60 : 50);
    outlineVariant         = hslToHex(neutralH, Math.min(n.s*0.3,15), isDark ? 30 : 80);
  }

  // Error (fixed)
  const error          = isDark ? '#FFB4AB' : '#B3261E';
  const onError        = isDark ? '#690005' : '#FFFFFF';
  const errorContainer = isDark ? '#93000A' : '#F9DEDC';
  const onErrorContainer = isDark ? '#FFDAD6' : '#410E0B';

  return [
    // ── Primary ──
    makeToken('primary', 'primary', 'primary', primary, isDark
      ? { operation: 'lighten', source: 'primary', param: 15, description: 'primary 톤 (dark: +15%)' }
      : { operation: 'source',  source: 'primary',             description: 'primary 키컬러 그대로' }),
    makeToken('onPrimary', 'onPrimary', 'primary', onPrimary, {
      operation: 'contrast', source: 'primary',
      description: 'primary 위 텍스트/아이콘 — WCAG 대비비 최적화',
    }),
    makeToken('primaryContainer', 'primaryContainer', 'primary', primaryContainer, {
      operation: 'setLightness', source: 'primary', param: isDark ? 25 : 90,
      description: `primary 계열 컨테이너 배경 (명도 ${isDark ? 25 : 90}%, 채도 감소)`,
    }),
    makeToken('onPrimaryContainer', 'onPrimaryContainer', 'primary', onPrimaryContainer, {
      operation: 'setLightness', source: 'primary', param: isDark ? 90 : 10,
      description: `primaryContainer 위 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Secondary ──
    makeToken('secondary', 'secondary', 'secondary', secondary, isDark
      ? { operation: 'lighten', source: 'secondary', param: 15, description: 'secondary 톤 (dark: +15%)' }
      : { operation: 'source',  source: 'secondary',             description: 'secondary 키컬러 그대로' }),
    makeToken('onSecondary', 'onSecondary', 'secondary', onSecondary, {
      operation: 'contrast', source: 'secondary',
      description: 'secondary 위 텍스트/아이콘 — WCAG 대비비 최적화',
    }),
    makeToken('secondaryContainer', 'secondaryContainer', 'secondary', secondaryContainer, {
      operation: 'setLightness', source: 'secondary', param: isDark ? 25 : 90,
      description: `secondary 계열 컨테이너 배경 (명도 ${isDark ? 25 : 90}%)`,
    }),
    makeToken('onSecondaryContainer', 'onSecondaryContainer', 'secondary', onSecondaryContainer, {
      operation: 'setLightness', source: 'secondary', param: isDark ? 90 : 10,
      description: `secondaryContainer 위 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Tertiary ──
    makeToken('tertiary', 'tertiary', 'tertiary', tertiary, isDark
      ? { operation: 'lighten', source: 'tertiary', param: 15, description: 'tertiary 톤 (dark: +15%)' }
      : { operation: 'source',  source: 'tertiary',             description: 'tertiary 키컬러 그대로 (강조/포인트)' }),
    makeToken('onTertiary', 'onTertiary', 'tertiary', onTertiary, {
      operation: 'contrast', source: 'tertiary',
      description: 'tertiary 위 텍스트/아이콘',
    }),
    makeToken('tertiaryContainer', 'tertiaryContainer', 'tertiary', tertiaryContainer, {
      operation: 'setLightness', source: 'tertiary', param: isDark ? 25 : 90,
      description: `tertiary 계열 컨테이너 배경 (명도 ${isDark ? 25 : 90}%)`,
    }),
    makeToken('onTertiaryContainer', 'onTertiaryContainer', 'tertiary', onTertiaryContainer, {
      operation: 'setLightness', source: 'tertiary', param: isDark ? 90 : 10,
      description: `tertiaryContainer 위 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Background ──
    makeToken('background', 'background', 'background', background, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 6 : 99,
      description: `앱 기본 배경색 (neutral 계열, 명도 ${isDark ? 6 : 99}%)`,
    }),
    makeToken('onBackground', 'onBackground', 'background', onBackground, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 90 : 10,
      description: `배경 위 기본 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Surface ──
    makeToken('surface', 'surface', 'surface', surface, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 8 : 98,
      description: `카드/시트 기본 배경 (명도 ${isDark ? 8 : 98}%)`,
    }),
    makeToken('surfaceVariant', 'surfaceVariant', 'surface', surfaceVariant, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 30 : 90,
      description: `surface 변형 — 구분 영역용 (명도 ${isDark ? 30 : 90}%)`,
    }),
    makeToken('onSurface', 'onSurface', 'surface', onSurface, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 90 : 10,
      description: `surface 위 기본 텍스트/아이콘 (명도 ${isDark ? 90 : 10}%)`,
    }),
    makeToken('onSurfaceVariant', 'onSurfaceVariant', 'surface', onSurfaceVariant, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 80 : 30,
      description: `surfaceVariant 위 텍스트 (명도 ${isDark ? 80 : 30}%)`,
    }),
    makeToken('surfaceContainerLowest', 'surfaceContainerLowest', 'surface', surfaceContainerLowest, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 4 : 100,
      description: `가장 낮은 elevation 컨테이너 (명도 ${isDark ? 4 : 100}%)`,
    }),
    makeToken('surfaceContainerLow', 'surfaceContainerLow', 'surface', surfaceContainerLow, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 10 : 96,
      description: `낮은 elevation 컨테이너 (명도 ${isDark ? 10 : 96}%)`,
    }),
    makeToken('surfaceContainer', 'surfaceContainer', 'surface', surfaceContainer, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 12 : 94,
      description: `기본 컨테이너 배경 (명도 ${isDark ? 12 : 94}%)`,
    }),
    makeToken('surfaceContainerHigh', 'surfaceContainerHigh', 'surface', surfaceContainerHigh, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 17 : 92,
      description: `높은 elevation 컨테이너 (명도 ${isDark ? 17 : 92}%)`,
    }),
    makeToken('surfaceContainerHighest', 'surfaceContainerHighest', 'surface', surfaceContainerHighest, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 22 : 90,
      description: `가장 높은 elevation 컨테이너 (명도 ${isDark ? 22 : 90}%)`,
    }),

    // ── Outline ──
    makeToken('outline', 'outline', 'outline', outline, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 60 : 50,
      description: `테두리/구분선 (명도 ${isDark ? 60 : 50}%)`,
    }),
    makeToken('outlineVariant', 'outlineVariant', 'outline', outlineVariant, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 30 : 80,
      description: `약한 테두리/구분선 (명도 ${isDark ? 30 : 80}%)`,
    }),

    // ── Error ──
    makeToken('error', 'error', 'error', error, {
      operation: 'fixed', source: 'error',
      description: '오류 상태 색 (MD3 고정값)',
    }),
    makeToken('onError', 'onError', 'error', onError, {
      operation: 'fixed', source: 'error',
      description: 'error 위 텍스트/아이콘',
    }),
    makeToken('errorContainer', 'errorContainer', 'error', errorContainer, {
      operation: 'fixed', source: 'error',
      description: '오류 컨테이너 배경',
    }),
    makeToken('onErrorContainer', 'onErrorContainer', 'error', onErrorContainer, {
      operation: 'fixed', source: 'error',
      description: 'errorContainer 위 텍스트',
    }),

    // ── Extra user-added groups ──
    ...Object.entries(src)
      .filter(([k]) => !KNOWN_BASE_KEYS.has(k))
      .flatMap(([k, hex]) => generateGroupTokens(k, hex, isDark, useOklch)),
  ];
}

const KNOWN_BASE_KEYS = new Set(['primary', 'secondary', 'tertiary', 'neutral']);

// Generate 4 standard tokens for any user-added color group
function generateGroupTokens(key: string, hex: string, isDark: boolean, useOklch = false): DesignToken[] {
  let color: string;
  if (!isDark) {
    color = hex;
  } else if (useOklch) {
    const ok = hexToOKLCH(hex);
    color = oklchToHex(Math.min(ok.l + 0.12, 0.87), ok.c, ok.h);
  } else {
    const { h, s, l } = hexToHSL(hex);
    color = hslToHex(h, Math.min(s, 80), Math.min(l + 15, 85));
  }
  const onColor = useOklch ? getOnColorOKLCH(color) : getOnColor(color);
  const container = makeContainer(hex, 90, isDark, useOklch);
  const onContainer = makeOnContainer(hex, isDark, useOklch);
  const cap = key.charAt(0).toUpperCase() + key.slice(1);
  return [
    makeToken(key, key, key, color, isDark
      ? { operation: 'lighten', source: key, param: 15, description: `${cap} 톤 (dark: +15%)` }
      : { operation: 'source',  source: key,             description: `${cap} 키컬러 그대로` }),
    makeToken(`on${cap}`, `on${cap}`, key, onColor, {
      operation: 'contrast', source: key,
      description: `${cap} 위 텍스트/아이콘`,
    }),
    makeToken(`${key}Container`, `${key}Container`, key, container, {
      operation: 'setLightness', source: key, param: isDark ? 25 : 90,
      description: `${cap} 컨테이너 배경`,
    }),
    makeToken(`on${cap}Container`, `on${cap}Container`, key, onContainer, {
      operation: 'setLightness', source: key, param: isDark ? 90 : 10,
      description: `${cap}Container 위 텍스트`,
    }),
  ];
}

// Apply stage1 transform to a hex color
function applyStage1(hex: string, stage1: 'source' | 'grayscale' | 'invert', useOklch: boolean): string {
  if (stage1 === 'grayscale') return useOklch ? grayscaleOKLCH(hex) : grayscaleHSL(hex);
  if (stage1 === 'invert')    return useOklch ? invertOKLCH(hex) : (() => { const { h, s, l } = hexToHSL(hex); return hslToHex(h, s, 100 - l); })();
  return hex;
}

// Apply stage2 modifier to a hex color
function applyStage2(hex: string, operation: string, p: number, useOklch: boolean): string {
  if (useOklch) {
    switch (operation) {
      case 'lighten':       return lightenOKLCH(hex, p);
      case 'darken':        return darkenOKLCH(hex, p);
      case 'setLightness':  return setLightnessOKLCH(hex, p / 100);
      case 'setSaturation': return setSaturationOKLCH(hex, p);
      case 'colorShift':    return colorShiftOKLCH(hex, p);
      default:              return hex;
    }
  }
  switch (operation) {
    case 'lighten':       return lighten(hex, p);
    case 'darken':        return darken(hex, p);
    case 'setLightness':  return setLightness(hex, p);
    case 'setSaturation': return setSaturation(hex, p);
    case 'colorShift':    { const { h, s, l } = hexToHSL(hex); return hslToHex((h + p) % 360, s, l); }
    default:              return hex;
  }
}

// Apply a TokenRule to compute the resulting hex color
export function applyRule(rule: TokenRule, base: BaseColors, isDark: boolean, useOklch = false): string {
  let sourceHex: string;
  if (rule.source === 'error') {
    sourceHex = isDark ? '#FFB4AB' : '#B3261E';
  } else {
    sourceHex = base[rule.source] ?? '#000000';
  }

  const p = rule.param ?? 50;

  // 2-stage system: stage1 defined
  if (rule.stage1 !== undefined) {
    const intermediate = applyStage1(sourceHex, rule.stage1, useOklch);
    if (rule.operation === 'source') return intermediate;
    return applyStage2(intermediate, rule.operation, p, useOklch);
  }

  // Legacy single-stage system (backward compat)
  if (useOklch) {
    switch (rule.operation) {
      case 'source':        return sourceHex;
      case 'contrast':      return getOnColorOKLCH(sourceHex);
      case 'lighten':       return lightenOKLCH(sourceHex, p);
      case 'darken':        return darkenOKLCH(sourceHex, p);
      case 'setLightness':  return setLightnessOKLCH(sourceHex, p / 100);
      case 'setSaturation': return setSaturationOKLCH(sourceHex, p);
      case 'colorShift':    return colorShiftOKLCH(sourceHex, p);
      case 'invert':        return invertOKLCH(sourceHex);
      case 'grayscale':     return grayscaleOKLCH(sourceHex);
      default:              return sourceHex;
    }
  }

  switch (rule.operation) {
    case 'source':        return sourceHex;
    case 'contrast':      return getOnColor(sourceHex);
    case 'lighten':       return lighten(sourceHex, p);
    case 'darken':        return darken(sourceHex, p);
    case 'setLightness':  return setLightness(sourceHex, p);
    case 'setSaturation': return setSaturation(sourceHex, p);
    case 'colorShift':    { const { h, s, l } = hexToHSL(sourceHex); return hslToHex((h + p) % 360, s, l); }
    case 'invert':        { const { h, s, l } = hexToHSL(sourceHex); return hslToHex(h, s, 100 - l); }
    case 'grayscale':     return grayscaleHSL(sourceHex);
    default:              return sourceHex;
  }
}

// Export helpers
export function tokensToCSS(tokens: DesignToken[]): string {
  const vars = tokens.map(t => `  --${t.name}: ${t.color};`).join('\n');
  return `:root {\n${vars}\n}`;
}

export function tokensToJSON(tokens: DesignToken[]): Record<string, string> {
  return Object.fromEntries(tokens.map(t => [t.name, t.color]));
}

export function buildFormulaString(keyLabel: string, settings: OpGenSettings, sourceLabel: string): string {
  const { stage1 = 'source', operation, param } = settings;
  const unit = operation === 'colorShift' ? '°' : '%';

  // stage1 prefix
  let stage1Part = '';
  if (stage1 === 'grayscale') stage1Part = 'grayscale('; 
  else if (stage1 === 'invert') stage1Part = 'invertLightness('; 
  // note: 'source' does nothing

  const baseExpr = (() => {
    switch (operation) {
      case 'source':        return `${sourceLabel}`;
      case 'contrast':      return `contrast(${sourceLabel})`;
      case 'invert':        return `invertLightness(${sourceLabel})`;
      case 'lighten':       return `lighten(${sourceLabel}, ${param}${unit})`;
      case 'darken':        return `darken(${sourceLabel}, ${param}${unit})`;
      case 'setSaturation': return `setSaturation(${sourceLabel}, ${param}${unit})`;
      case 'setLightness':  return `setLightness(${sourceLabel}, ${param}${unit})`;
      case 'colorShift':    return `colorShift(${sourceLabel}, ${param}${unit})`;
      default:              return `${keyLabel}`;
    }
  })();

  if (stage1Part) {
    return `f  ${stage1Part}${baseExpr})`;
  }
  return `f  ${baseExpr}`;
}
