'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore, DEFAULT_GENERATE_RULE, DEFAULT_GENERATE_RULES } from '@/store/colorStore';
import { ColorShape } from '@/app/components/ColorShape';
import { RangeRow } from '@/app/components/RangeRow';
import { GenerateRule } from '@/types/tokens';

interface Props {
  onClose: () => void;
}

export default function GenerateSettingsPopup({ onClose }: Props) {
  const { groupOrder, groupLabels, baseColors, generateRules, setGenerateRule, setDefaultGenerateRules, useOklch } = useColorStore();
  const popupRef = useRef<HTMLDivElement>(null);

  const [localRules, setLocalRules] = useState<Record<string, GenerateRule>>(() =>
    Object.fromEntries(
      groupOrder.map(k => [k, generateRules[k] ?? DEFAULT_GENERATE_RULES[k] ?? { ...DEFAULT_GENERATE_RULE }])
    )
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const updateRule = (key: string, channel: 'h' | 's' | 'l', value: { min: number; max: number }) => {
    setLocalRules(prev => ({ ...prev, [key]: { ...prev[key], [channel]: value } }));
  };

  const handleReset = () => {
    setLocalRules(Object.fromEntries(
      groupOrder.map(k => [k, { ...DEFAULT_GENERATE_RULE }])
    ));
  };

  const handleSetAsDefault = () => {
    Object.entries(localRules).forEach(([key, rule]) => {
      setGenerateRule(key, rule);
      setDefaultGenerateRules(key, rule);
    });
  };

  const handleSave = () => {
    Object.entries(localRules).forEach(([key, rule]) => setGenerateRule(key, rule));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={popupRef}
        className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[560px] flex flex-col overflow-hidden max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex h-[70px] items-center justify-between px-6 shrink-0">
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-[16px] text-[#333]">Generate Settings</p>
            <p className="text-[12px] font-medium text-[#999]">키컬러별 생성 범위</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#eee] flex flex-col gap-px py-px">
          {groupOrder.map(key => {
            const label = groupLabels[key] ?? key;
            const hex = baseColors[key] ?? '#000000';
            const rule = localRules[key] ?? DEFAULT_GENERATE_RULE;
            return (
              <div key={key} className="bg-white px-6 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <ColorShape color={hex} size={48} />
                  <span className="font-semibold text-[14px] text-[#333]">{label}</span>
                </div>
                <div className="flex flex-col gap-2.5 pl-[52px]">
                  {(
                    useOklch ? ['l', 's', 'h'] : ['h', 's', 'l']
                  ).map(channel => {
                    const labelMap: Record<string, string> = useOklch
                      ? { l: 'L', s: 'C', h: 'H' }
                      : { h: 'H', s: 'S', l: 'L' };
                    const floorMap: Record<string, number> = { h: 0, s: 0, l: 0 };
                    const ceilMap: Record<string, number> = { h: 360, s: 100, l: 100 };
                    const value = (rule as any)[channel];
                    return (
                      <RangeRow
                        key={channel}
                        label={labelMap[channel]}
                        floor={floorMap[channel]}
                        ceil={ceilMap[channel]}
                        value={value}
                        onChange={v => updateRule(key, channel as 'h' | 's' | 'l', v)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex h-[70px] items-center justify-between px-[30px] shrink-0">
          <div className="flex gap-2.5">
            <button
              onClick={handleReset}
              className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSetAsDefault}
              className="h-9 px-4 bg-[#e8eeff] rounded-[10px] text-[13px] font-medium text-[#4a7cf5] hover:bg-[#d8e4ff] transition-colors"
            >
              Set as default
            </button>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="h-9 w-[90px] bg-[#f5f5f5] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-9 w-[90px] bg-[#666] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
