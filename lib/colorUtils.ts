// HEX to HSL
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// HSL to HEX
export function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120){ r = x; g = c; b = 0; }
  else if (h < 180){ r = 0; g = c; b = x; }
  else if (h < 240){ r = 0; g = x; b = c; }
  else if (h < 300){ r = x; g = 0; b = c; }
  else             { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// HEX to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Relative luminance (WCAG)
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Contrast ratio (WCAG)
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Best on-color (white or dark near-black) for WCAG AA
export function getOnColor(hex: string): string {
  const white = '#FFFFFF';
  const dark = '#1C1B1F';
  const contrastWhite = getContrastRatio(hex, white);
  const contrastDark = getContrastRatio(hex, dark);
  return contrastWhite >= contrastDark ? white : dark;
}

// OKLCH-based on-color: preserves source hue with subtle tint
export function getOnColorOKLCH(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  const targetL = l > 0.5 ? 0.15 : 0.95;
  const targetC = Math.min(c * 0.12, 0.025); // hue 기색만 살리고 채도는 최소화
  return oklchToHex(targetL, targetC, h);
}

// Set specific lightness, preserve h+s
export function setLightness(hex: string, l: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, hsl.s, l);
}

// Set specific saturation
export function setSaturation(hex: string, s: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, s, hsl.l);
}

// Lighten by adding to L
export function lighten(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + amount));
}

// Darken by subtracting from L
export function darken(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount));
}

// Generate a random vibrant color (OKLCH — 지각적으로 균일한 밝기/채도)
export function generateRandomColor(): string {
  const h = Math.random() * 360;
  const l = 0.38 + Math.random() * 0.24; // 0.38~0.62: 너무 어둡거나 밝지 않은 중간 톤
  const c = 0.08 + Math.random() * 0.14; // 0.08~0.22: 자연 채도 범위
  return oklchToHex(l, c, h);
}

// Generate a random color within specified HSL ranges
export function generateRandomColorInRange(rule: { h: { min: number; max: number }; s: { min: number; max: number }; l: { min: number; max: number } }): string {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const h = rand(Math.max(0, rule.h.min), Math.min(360, rule.h.max));
  const s = rand(Math.max(0, rule.s.min), Math.min(100, rule.s.max));
  const l = rand(Math.max(0, rule.l.min), Math.min(100, rule.l.max));
  return hslToHex(h, s, l);
}

// Validate hex string
export function isValidHex(hex: string): boolean {
  return /^#([a-f\d]{3}|[a-f\d]{6})$/i.test(hex);
}

// Normalize 3-char hex to 6-char
export function normalizeHex(hex: string): string {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return '#' + hex.toLowerCase();
}

// ─── HSV Color Space ─────────────────────────────────────────────────────────

export function hslToHSV(h: number, s: number, l: number): { h: number; s: number; v: number } {
  s /= 100;
  l /= 100;
  const v = l + s * Math.min(l, 1 - l);
  const newS = v === 0 ? 0 : 2 * (1 - l / v);
  return { h, s: Math.round(newS * 100), v: Math.round(v * 100) };
}

export function hsvToHSL(h: number, s: number, v: number): { h: number; s: number; l: number } {
  h = h % 360;
  s /= 100;
  v /= 100;
  const l = v * (1 - s / 2);
  const newS = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return { h, s: Math.round(newS * 100), l: Math.round(l * 100) };
}

export function hsvToHex(h: number, s: number, v: number): string {
  h = h % 360;
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60)        { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
  else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
  else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
  else if (300 <= h && h < 360){ r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ─── OKLCH Color Space ───────────────────────────────────────────────────────
// Perceptually uniform: same L = same visual brightness across all hues.

function _linearize(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function _delinearize(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/** HEX → OKLCH  (L: 0–1, C: 0–~0.4, H: 0–360°) */
export function hexToOKLCH(hex: string): { l: number; c: number; h: number } {
  const r$ = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r$) return { l: 0.5, c: 0, h: 0 };
  const r = _linearize(parseInt(r$[1], 16) / 255);
  const g = _linearize(parseInt(r$[2], 16) / 255);
  const b = _linearize(parseInt(r$[3], 16) / 255);
  // Linear sRGB → LMS
  const ll = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const ml = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const sl = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(ll);
  const m_ = Math.cbrt(ml);
  const s_ = Math.cbrt(sl);
  // LMS' → OKLab
  const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(a * a + bv * bv);
  let H = (Math.atan2(bv, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: H };
}

/** OKLCH → HEX (clamps out-of-gamut values) */
export function oklchToHex(l: number, c: number, h: number): string {
  const a  = c * Math.cos((h * Math.PI) / 180);
  const bv = c * Math.sin((h * Math.PI) / 180);
  // OKLab → LMS'
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * bv;
  const ll = l_ * l_ * l_;
  const ml = m_ * m_ * m_;
  const sl = s_ * s_ * s_;
  // LMS → Linear sRGB
  let r =  4.0767416621 * ll - 3.3077115913 * ml + 0.2309699292 * sl;
  let g = -1.2684380046 * ll + 2.6097574011 * ml - 0.3413193965 * sl;
  let b = -0.0041960863 * ll - 0.7034186147 * ml + 1.7076147010 * sl;
  // Gamma + clamp
  r = Math.max(0, Math.min(1, _delinearize(r)));
  g = Math.max(0, Math.min(1, _delinearize(g)));
  b = Math.max(0, Math.min(1, _delinearize(b)));
  const toH = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

export function setLightnessOKLCH(hex: string, l01: number): string {
  const ok = hexToOKLCH(hex);
  return oklchToHex(Math.max(0, Math.min(1, l01)), ok.c, ok.h);
}
export function lightenOKLCH(hex: string, amount: number): string {
  const ok = hexToOKLCH(hex);
  return oklchToHex(Math.min(1, ok.l + amount / 100), ok.c, ok.h);
}
export function darkenOKLCH(hex: string, amount: number): string {
  const ok = hexToOKLCH(hex);
  return oklchToHex(Math.max(0, ok.l - amount / 100), ok.c, ok.h);
}
export function setSaturationOKLCH(hex: string, s: number): string {
  // s: 0–100 maps to chroma 0–0.37 (approx max natural chroma)
  const ok = hexToOKLCH(hex);
  return oklchToHex(ok.l, (s / 100) * 0.37, ok.h);
}
export function colorShiftOKLCH(hex: string, degrees: number): string {
  const ok = hexToOKLCH(hex);
  return oklchToHex(ok.l, ok.c, (ok.h + degrees) % 360);
}
export function invertOKLCH(hex: string): string {
  const ok = hexToOKLCH(hex);
  return oklchToHex(1 - ok.l, ok.c, ok.h);
}
