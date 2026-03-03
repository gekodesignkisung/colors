'use client';

import { useRef } from 'react';
import { useColorStore } from '@/store/colorStore';
import { BaseColors } from '@/types/tokens';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';

const COLOR_LABELS: { key: keyof BaseColors; label: string; desc: string }[] = [
  { key: 'primary',   label: 'Primary',   desc: '주요 브랜드 색상' },
  { key: 'secondary', label: 'Secondary', desc: '보조 색상' },
  { key: 'tertiary',  label: 'Tertiary',  desc: '강조/포인트 색상' },
  { key: 'neutral',   label: 'Neutral',   desc: '중성 색상 (surface/outline 기준)' },
];

export default function BaseColorInput() {
  const { baseColors, setBaseColor, randomizeColors } = useColorStore();

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Colors</span>
        <button
          onClick={randomizeColors}
          className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
          title="랜덤 색상 생성"
        >
          Randomize
        </button>
      </div>

      <div className="space-y-2">
        {COLOR_LABELS.map(({ key, label, desc }) => (
          <ColorRow
            key={key}
            colorKey={key}
            label={label}
            desc={desc}
            value={baseColors[key]}
            onChange={(hex) => setBaseColor(key, hex)}
          />
        ))}
      </div>
    </div>
  );
}

function ColorRow({
  colorKey,
  label,
  desc,
  value,
  onChange,
}: {
  colorKey: keyof BaseColors;
  label: string;
  desc: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (textRef.current) textRef.current.value = e.target.value;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isValidHex(val)) {
      const hex = normalizeHex(val);
      onChange(hex);
      if (inputRef.current) inputRef.current.value = hex;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Color swatch / native picker trigger */}
      <button
        onClick={() => inputRef.current?.click()}
        className="w-7 h-7 rounded-md border border-black/10 shrink-0 shadow-sm hover:scale-110 transition-transform"
        style={{ backgroundColor: value }}
        title={desc}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={handlePickerChange}
        className="sr-only"
      />

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 leading-none mb-0.5">{label}</div>
        <input
          ref={textRef}
          type="text"
          defaultValue={value}
          onChange={handleTextChange}
          maxLength={7}
          className="w-full text-xs text-gray-500 bg-transparent outline-none font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
