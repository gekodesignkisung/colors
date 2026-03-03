'use client';

import { useRef } from 'react';
import { useColorStore } from '@/store/colorStore';
import { BaseColors } from '@/types/tokens';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';

const COLOR_LABELS: { key: keyof BaseColors; label: string }[] = [
  { key: 'primary',   label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'tertiary',  label: 'Tertiary' },
  { key: 'neutral',   label: 'Neutral' },
];

export default function BaseColorInput() {
  const { baseColors, setBaseColor, randomizeColors } = useColorStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header — #707077, 56px */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#707077] px-[15px]">
        <span className="text-white font-semibold text-base">Key Colors</span>
        <div className="flex items-center justify-center w-[30px] h-[30px]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <line x1="2" y1="4.5" x2="14" y2="4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="6" cy="4.5" r="1.75" fill="#707077" stroke="white" strokeWidth="1.5"/>
            <line x1="2" y1="11.5" x2="14" y2="11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="11.5" r="1.75" fill="#707077" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-10">
          {/* Color cards */}
          <div className="flex flex-col gap-2.5">
            {COLOR_LABELS.map(({ key, label }) => (
              <ColorCard
                key={key}
                colorKey={key}
                label={label}
                value={baseColors[key]}
                onChange={(hex) => setBaseColor(key, hex)}
              />
            ))}
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={randomizeColors}
            className="flex items-center w-full h-[50px] bg-white border border-[#e8e8e8] rounded-full pl-[10px] pr-5 gap-2 cursor-pointer hover:opacity-75 transition-opacity"
          >
            <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-[#f0f0f0]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2.5 6H11M8.5 3.5L11 6l-2.5 2.5" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.5 12H7M10.5 9.5L8 12l2.5 2.5" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-sm text-[#333333]">Generate</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorCard({
  colorKey,
  label,
  value,
  onChange,
}: {
  colorKey: keyof BaseColors;
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (textRef.current) textRef.current.value = e.target.value.toUpperCase();
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
    <div className="flex items-center h-[60px]">
      {/* 60×60 circle swatch — dynamic color via inline style */}
      <button
        type="button"
        title={`${label} 색상 선택`}
        aria-label={`${label} 색상 선택`}
        onClick={() => inputRef.current?.click()}
        className="w-[60px] h-[60px] rounded-full border border-black/[0.08] shrink-0 cursor-pointer hover:scale-105 transition-transform"
        style={{ backgroundColor: value }}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={handlePickerChange}
        aria-label={`${label} 색상 피커`}
        className="sr-only"
      />

      {/* Label + hex */}
      <div className="pl-5 flex flex-col gap-1">
        <span className="font-semibold text-sm text-[#333333]">{label}</span>
        <input
          ref={textRef}
          type="text"
          defaultValue={value.toUpperCase()}
          onChange={handleTextChange}
          maxLength={7}
          title={`${label} hex 값`}
          aria-label={`${label} hex 색상값`}
          className="text-xs font-medium text-[#999999] bg-transparent border-none outline-none p-0 w-[72px] font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
