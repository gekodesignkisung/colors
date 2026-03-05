'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import KeyColorEditPopup from '@/app/components/KeyColorEditPopup';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';

/** Format OKLCH values for display: oklch(0.55 0.18 293°) */
function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `oklch(${l.toFixed(2)} ${c.toFixed(3)} ${Math.round(h)}°)`;
}

const CORE_KEYS = new Set(['primary', 'secondary', 'tertiary', 'neutral']);

export default function BaseColorInput() {
  const {
    baseColors, groupOrder, groupLabels, groupDescriptions,
    setBaseColor, setGroupLabel, setGroupDescription,
    addGroup, removeGroup, randomizeColors,
    useOklch, toggleOklch,
  } = useColorStore();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const handleSave = (key: string, hex: string, label: string, desc: string) => {
    setBaseColor(key, hex);
    setGroupLabel(key, label);
    setGroupDescription(key, desc);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#707077] px-[15px]">
        <span className="text-white font-semibold text-base">Key Colors</span>
        <button
          type="button"
          title="그룹 추가"
          onClick={() => setCreatingGroup(true)}
          className="flex items-center justify-center w-8 h-8 hover:opacity-70 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-add.svg" alt="" width={32} height={32} aria-hidden="true" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-10">
          {/* Color cards */}
          <div className="flex flex-col gap-1">
            {groupOrder.map((key) => {
              const label = groupLabels[key] ?? key;
              const raw = baseColors[key] ?? '#000000';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className="flex items-center min-h-[64px] w-full px-2 py-2 rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer text-left"
                >
                  {/* Swatch */}
                  <ColorShape color={raw} size={48} className="shrink-0" />
                  {/* Label + hex + oklch */}
                  <div className="pl-4 flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-[#333333] leading-tight">{label}</span>
                    <span className="text-xs font-medium text-[#999999] font-mono">{raw.toUpperCase()}</span>
                    {useOklch && (
                      <span className="text-[10px] text-[#a78bfa] font-mono leading-none">{toOklchLabel(raw)}</span>
                    )}
                  </div>
                  {/* Arrow hint */}
                  <div className="ml-auto">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-[#ccc]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}


          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={randomizeColors}
            className="flex items-center justify-center w-full h-[50px] bg-white border border-[#999] rounded-full shadow-[0px_3px_6px_0px_rgba(0,0,0,0.1)] gap-2 cursor-pointer hover:opacity-75 transition-opacity"
          >
            <div className="flex items-center justify-center shrink-0 w-8 h-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-generate.svg" alt="" width={22} height={22} aria-hidden="true" />
            </div>
            <span className="font-semibold text-sm text-[#333333]">Generate</span>
          </button>
        </div>
      </div>

      {/* OKLCH toggle — fixed bottom bar */}
      <div className="shrink-0 px-5 py-4 border-t border-[#ebebeb] bg-white">
        <button
          type="button"
          title={useOklch ? 'OKLCH mode on' : 'OKLCH mode off'}
          aria-label="Generate colors by OKLCH"
          onClick={toggleOklch}
          className="flex items-center justify-between w-full group"
        >
          <div className="text-left">
            <p className={`text-xs font-semibold leading-tight transition-colors ${useOklch ? 'text-[#707077]' : 'text-[#333]'}`}>
              Generate with OKLCH
            </p>
            <p className="text-[11px] text-[#aaa] mt-0.5 leading-tight">Perceptually uniform color space</p>
          </div>

          {/* Track */}
          <div className={`relative shrink-0 w-11 h-[26px] rounded-full transition-all duration-200 ${useOklch ? 'bg-[#707077]' : 'bg-[#e0e0e0]'}`}>
            {/* Thumb */}
            <span
              className={`absolute left-0 top-[3px] w-5 h-5 rounded-full bg-white transition-all duration-200
                shadow-[0_1px_4px_rgba(0,0,0,0.22)]
                ${useOklch ? 'translate-x-[21px]' : 'translate-x-[3px]'}`}
            />
          </div>
        </button>
      </div>

      {/* Edit popup */}
      {selectedKey && (
        <KeyColorEditPopup
          colorKey={selectedKey}
          initialHex={baseColors[selectedKey] ?? '#000000'}
          initialLabel={groupLabels[selectedKey] ?? selectedKey}
          initialDescription={groupDescriptions[selectedKey] ?? ''}
          isCore={CORE_KEYS.has(selectedKey)}
          onSave={(hex, label, desc) => handleSave(selectedKey, hex, label, desc)}
          onClose={() => setSelectedKey(null)}
          onRemove={!CORE_KEYS.has(selectedKey) ? () => removeGroup(selectedKey) : undefined}
        />
      )}

      {/* Create popup */}
      {creatingGroup && (
        <KeyColorEditPopup
          colorKey="New Group"
          initialHex="#6750A4"
          initialLabel=""
          initialDescription=""
          isCore={false}
          onSave={(hex, label, desc) => {
            const finalLabel = label.trim() || 'New Group';
            addGroup(finalLabel, hex, desc);
          }}
          onClose={() => setCreatingGroup(false)}
        />
      )}
    </div>
  );
}

