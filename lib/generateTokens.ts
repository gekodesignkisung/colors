import { BaseColors, DesignToken, TokenGroup, TokenRule } from '@/types/tokens';
import { hexToHSL, hslToHex, getOnColor, setLightness, setSaturation } from './colorUtils';

function makeToken(
  id: string,
  name: string,
  group: TokenGroup,
  color: string,
  rule: TokenRule
): DesignToken {
  return { id, name, group, color, rule, isManual: false };
}

// Generate a tonal container: preserve hue, reduce saturation, push to high lightness
function makeContainer(hex: string, lightL = 90, darkMode = false): string {
  const { h, s } = hexToHSL(hex);
  const targetL = darkMode ? 25 : lightL;
  const targetS = darkMode ? Math.min(s * 0.6, 40) : Math.min(s * 0.5, 50);
  return hslToHex(h, targetS, targetL);
}

// onContainer: same hue, high saturation, dark/light depending on container
function makeOnContainer(hex: string, darkMode = false): string {
  const { h, s } = hexToHSL(hex);
  const targetL = darkMode ? 90 : 10;
  return hslToHex(h, Math.min(s * 0.8, 80), targetL);
}

export function generateTokens(base: BaseColors, isDark = false): DesignToken[] {
  const p = hexToHSL(base.primary);
  const s = hexToHSL(base.secondary);
  const t = hexToHSL(base.tertiary);
  const n = hexToHSL(base.neutral);

  // Primary
  const primary = isDark
    ? hslToHex(p.h, Math.min(p.s, 80), Math.min(p.l + 15, 85))
    : base.primary;
  const onPrimary = getOnColor(primary);
  const primaryContainer = makeContainer(base.primary, 90, isDark);
  const onPrimaryContainer = makeOnContainer(base.primary, isDark);

  // Secondary
  const secondary = isDark
    ? hslToHex(s.h, Math.min(s.s, 70), Math.min(s.l + 15, 80))
    : base.secondary;
  const onSecondary = getOnColor(secondary);
  const secondaryContainer = makeContainer(base.secondary, 90, isDark);
  const onSecondaryContainer = makeOnContainer(base.secondary, isDark);

  // Tertiary
  const tertiary = isDark
    ? hslToHex(t.h, Math.min(t.s, 70), Math.min(t.l + 15, 80))
    : base.tertiary;
  const onTertiary = getOnColor(tertiary);
  const tertiaryContainer = makeContainer(base.tertiary, 90, isDark);
  const onTertiaryContainer = makeOnContainer(base.tertiary, isDark);

  // Surface tones (from neutral hue)
  const neutralH = n.h;
  const neutralS = Math.min(n.s * 0.2, 10);

  const background      = isDark ? hslToHex(neutralH, neutralS, 6)  : hslToHex(neutralH, neutralS, 99);
  const onBackground    = isDark ? hslToHex(neutralH, neutralS, 90) : hslToHex(neutralH, neutralS, 10);

  const surface                  = isDark ? hslToHex(neutralH, neutralS, 8)  : hslToHex(neutralH, neutralS, 98);
  const surfaceVariant           = isDark ? hslToHex(neutralH, Math.min(n.s*0.3,15), 30) : hslToHex(neutralH, Math.min(n.s*0.3,15), 90);
  const onSurface                = isDark ? hslToHex(neutralH, neutralS, 90) : hslToHex(neutralH, neutralS, 10);
  const onSurfaceVariant         = isDark ? hslToHex(neutralH, Math.min(n.s*0.4,20), 80) : hslToHex(neutralH, Math.min(n.s*0.4,20), 30);

  const surfaceContainerLowest   = isDark ? hslToHex(neutralH, neutralS, 4)  : hslToHex(neutralH, neutralS, 100);
  const surfaceContainerLow      = isDark ? hslToHex(neutralH, neutralS, 10) : hslToHex(neutralH, neutralS, 96);
  const surfaceContainer         = isDark ? hslToHex(neutralH, neutralS, 12) : hslToHex(neutralH, neutralS, 94);
  const surfaceContainerHigh     = isDark ? hslToHex(neutralH, neutralS, 17) : hslToHex(neutralH, neutralS, 92);
  const surfaceContainerHighest  = isDark ? hslToHex(neutralH, neutralS, 22) : hslToHex(neutralH, neutralS, 90);

  // Outline
  const outline        = hslToHex(neutralH, Math.min(n.s*0.4,20), isDark ? 60 : 50);
  const outlineVariant = hslToHex(neutralH, Math.min(n.s*0.3,15), isDark ? 30 : 80);

  // Error (fixed)
  const error          = isDark ? '#FFB4AB' : '#B3261E';
  const onError        = isDark ? '#690005' : '#FFFFFF';
  const errorContainer = isDark ? '#93000A' : '#F9DEDC';
  const onErrorContainer = isDark ? '#FFDAD6' : '#410E0B';

  return [
    // ── Primary ──
    makeToken('primary', 'primary', 'Primary', primary, {
      operation: 'source', source: 'primary',
      description: 'primary 기본색 (다크모드: 밝기 +15%)',
    }),
    makeToken('onPrimary', 'onPrimary', 'Primary', onPrimary, {
      operation: 'contrast', source: 'primary',
      description: 'primary 위 텍스트/아이콘 — WCAG 대비비 최적화',
    }),
    makeToken('primaryContainer', 'primaryContainer', 'Primary', primaryContainer, {
      operation: 'setLightness', source: 'primary', param: isDark ? 25 : 90,
      description: `primary 계열 컨테이너 배경 (명도 ${isDark ? 25 : 90}%, 채도 감소)`,
    }),
    makeToken('onPrimaryContainer', 'onPrimaryContainer', 'Primary', onPrimaryContainer, {
      operation: 'setLightness', source: 'primary', param: isDark ? 90 : 10,
      description: `primaryContainer 위 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Secondary ──
    makeToken('secondary', 'secondary', 'Secondary', secondary, {
      operation: 'source', source: 'secondary',
      description: 'secondary 기본색',
    }),
    makeToken('onSecondary', 'onSecondary', 'Secondary', onSecondary, {
      operation: 'contrast', source: 'secondary',
      description: 'secondary 위 텍스트/아이콘 — WCAG 대비비 최적화',
    }),
    makeToken('secondaryContainer', 'secondaryContainer', 'Secondary', secondaryContainer, {
      operation: 'setLightness', source: 'secondary', param: isDark ? 25 : 90,
      description: `secondary 계열 컨테이너 배경 (명도 ${isDark ? 25 : 90}%)`,
    }),
    makeToken('onSecondaryContainer', 'onSecondaryContainer', 'Secondary', onSecondaryContainer, {
      operation: 'setLightness', source: 'secondary', param: isDark ? 90 : 10,
      description: `secondaryContainer 위 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Tertiary ──
    makeToken('tertiary', 'tertiary', 'Tertiary', tertiary, {
      operation: 'source', source: 'tertiary',
      description: 'tertiary 기본색 (강조/포인트)',
    }),
    makeToken('onTertiary', 'onTertiary', 'Tertiary', onTertiary, {
      operation: 'contrast', source: 'tertiary',
      description: 'tertiary 위 텍스트/아이콘',
    }),
    makeToken('tertiaryContainer', 'tertiaryContainer', 'Tertiary', tertiaryContainer, {
      operation: 'setLightness', source: 'tertiary', param: isDark ? 25 : 90,
      description: `tertiary 계열 컨테이너 배경 (명도 ${isDark ? 25 : 90}%)`,
    }),
    makeToken('onTertiaryContainer', 'onTertiaryContainer', 'Tertiary', onTertiaryContainer, {
      operation: 'setLightness', source: 'tertiary', param: isDark ? 90 : 10,
      description: `tertiaryContainer 위 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Background ──
    makeToken('background', 'background', 'Background', background, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 6 : 99,
      description: `앱 기본 배경색 (neutral 계열, 명도 ${isDark ? 6 : 99}%)`,
    }),
    makeToken('onBackground', 'onBackground', 'Background', onBackground, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 90 : 10,
      description: `배경 위 기본 텍스트 (명도 ${isDark ? 90 : 10}%)`,
    }),

    // ── Surface ──
    makeToken('surface', 'surface', 'Surface', surface, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 8 : 98,
      description: `카드/시트 기본 배경 (명도 ${isDark ? 8 : 98}%)`,
    }),
    makeToken('surfaceVariant', 'surfaceVariant', 'Surface', surfaceVariant, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 30 : 90,
      description: `surface 변형 — 구분 영역용 (명도 ${isDark ? 30 : 90}%)`,
    }),
    makeToken('onSurface', 'onSurface', 'Surface', onSurface, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 90 : 10,
      description: `surface 위 기본 텍스트/아이콘 (명도 ${isDark ? 90 : 10}%)`,
    }),
    makeToken('onSurfaceVariant', 'onSurfaceVariant', 'Surface', onSurfaceVariant, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 80 : 30,
      description: `surfaceVariant 위 텍스트 (명도 ${isDark ? 80 : 30}%)`,
    }),
    makeToken('surfaceContainerLowest', 'surfaceContainerLowest', 'Surface', surfaceContainerLowest, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 4 : 100,
      description: `가장 낮은 elevation 컨테이너 (명도 ${isDark ? 4 : 100}%)`,
    }),
    makeToken('surfaceContainerLow', 'surfaceContainerLow', 'Surface', surfaceContainerLow, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 10 : 96,
      description: `낮은 elevation 컨테이너 (명도 ${isDark ? 10 : 96}%)`,
    }),
    makeToken('surfaceContainer', 'surfaceContainer', 'Surface', surfaceContainer, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 12 : 94,
      description: `기본 컨테이너 배경 (명도 ${isDark ? 12 : 94}%)`,
    }),
    makeToken('surfaceContainerHigh', 'surfaceContainerHigh', 'Surface', surfaceContainerHigh, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 17 : 92,
      description: `높은 elevation 컨테이너 (명도 ${isDark ? 17 : 92}%)`,
    }),
    makeToken('surfaceContainerHighest', 'surfaceContainerHighest', 'Surface', surfaceContainerHighest, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 22 : 90,
      description: `가장 높은 elevation 컨테이너 (명도 ${isDark ? 22 : 90}%)`,
    }),

    // ── Outline ──
    makeToken('outline', 'outline', 'Outline', outline, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 60 : 50,
      description: `테두리/구분선 (명도 ${isDark ? 60 : 50}%)`,
    }),
    makeToken('outlineVariant', 'outlineVariant', 'Outline', outlineVariant, {
      operation: 'setLightness', source: 'neutral', param: isDark ? 30 : 80,
      description: `약한 테두리/구분선 (명도 ${isDark ? 30 : 80}%)`,
    }),

    // ── Error ──
    makeToken('error', 'error', 'Error', error, {
      operation: 'fixed', source: 'error',
      description: '오류 상태 색 (MD3 고정값)',
    }),
    makeToken('onError', 'onError', 'Error', onError, {
      operation: 'fixed', source: 'error',
      description: 'error 위 텍스트/아이콘',
    }),
    makeToken('errorContainer', 'errorContainer', 'Error', errorContainer, {
      operation: 'fixed', source: 'error',
      description: '오류 컨테이너 배경',
    }),
    makeToken('onErrorContainer', 'onErrorContainer', 'Error', onErrorContainer, {
      operation: 'fixed', source: 'error',
      description: 'errorContainer 위 텍스트',
    }),
  ];
}

// Export helpers
export function tokensToCSS(tokens: DesignToken[]): string {
  const vars = tokens.map(t => `  --${t.name}: ${t.color};`).join('\n');
  return `:root {\n${vars}\n}`;
}

export function tokensToJSON(tokens: DesignToken[]): Record<string, string> {
  return Object.fromEntries(tokens.map(t => [t.name, t.color]));
}
