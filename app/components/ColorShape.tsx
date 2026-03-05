/**
 * ColorShape — renders the icon-color-shape.svg squircle filled with a given color.
 * Use this instead of a plain `<div>` / `<span>` for all color swatches.
 */
const SHAPE_PATH =
  'M12 0C21.6 0 24 2.4 24 12C24 21.6 21.6 24 12 24C2.4 24 0 21.6 0 12C0 2.4 2.4 0 12 0Z';

interface ColorShapeProps {
  color: string;
  size?: number;
  className?: string;
}

export function ColorShape({ color, size = 24, className }: ColorShapeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d={SHAPE_PATH} fill={color} />
    </svg>
  );
}
