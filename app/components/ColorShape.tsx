/**
 * ColorShape — 컬러 스와치 박스. rounded-full div로 렌더링.
 * #f9f9f9 보다 밝은 색이면 #ccc 1px border 자동 적용.
 */

/** #f9f9f9(249,249,249) 이상으로 밝은 색이면 true */
function isBrighterThanThreshold(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return r >= 249 && g >= 249 && b >= 249;
}

interface ColorShapeProps {
  color: string;
  size?: number;
  className?: string;
  /** optional border color */
  borderColor?: string;
  /** border width in px (defaults to 1) */
  borderWidth?: number;
}

export function ColorShape({ color, size = 24, className, borderColor, borderWidth = 1 }: ColorShapeProps) {
  const autoBorder = !borderColor && isBrighterThanThreshold(color) ? '#cccccc' : undefined;
  const resolvedBorder = borderColor ?? autoBorder;

  return (
    <div
      className={`rounded-full shrink-0 ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        border: resolvedBorder ? `${borderWidth}px solid ${resolvedBorder}` : undefined,
        boxSizing: 'border-box',
        transition: 'background-color 0.5s ease, border-color 0.5s ease',
      }}
      aria-hidden="true"
    />
  );
}
