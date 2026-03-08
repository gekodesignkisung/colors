'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore, DEFAULT_GENERATE_RULE, DEFAULT_GENERATE_RULES } from '@/store/colorStore';
import { ColorShape } from '@/app/components/ColorShape';
import { GenerateRule } from '@/types/tokens';

interface DualTrackProps {
  floor: number;
  ceil: number;
  min: number;
  max: number;
  onChange: (v: { min: number; max: number }) => void;
}

function DualTrack({ floor, ceil, min, max, onChange }: DualTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);

  const pct = (v: number) => ((v - floor) / (ceil - floor)) * 100;

  const valueFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(floor + ratio * (ceil - floor));
  };

  const startDrag = (which: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = which;
    const onMove = (ev: MouseEvent) => {
      const val = valueFromClientX(ev.clientX);
      if (dragging.current === 'min') onChange({ min: Math.min(val, max), max });
      else onChange({ min, max: Math.max(val, min) });
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragging.current) return;
    const val = valueFromClientX(e.clientX);
    if (Math.abs(val - min) <= Math.abs(val - max)) onChange({ min: Math.min(val, max), max });
    else onChange({ min, max: Math.max(val, min) });
  };

  return (
    <div
      ref={trackRef}
      className="flex-1 relative h-[4px] bg-[#f0f0f0] rounded-full mx-2 cursor-pointer"
      onClick={handleTrackClick}
    >
      {/* Filled range */}
      <div
        className="absolute h-full bg-[#808088] rounded-full pointer-events-none"
        style={{ left: `${pct(min)}%`, width: `${Math.max(0, pct(max) - pct(min))}%` }}
      />
      {/* Min handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-white border-2 border-[#808088] cursor-grab shadow-sm hover:scale-110 transition-transform"
        style={{ left: `${pct(min)}%` }}
        onMouseDown={startDrag('min')}
      />
      {/* Max handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-white border-2 border-[#808088] cursor-grab shadow-sm hover:scale-110 transition-transform"
        style={{ left: `${pct(max)}%` }}
        onMouseDown={startDrag('max')}
      />
    </div>
  );
}

interface RangeRowProps {
  label: string;
  floor: number;
  ceil: number;
  value: { min: number; max: number };
  onChange: (v: { min: number; max: number }) => void;
}

function RangeRow({ label, floor, ceil, value, onChange }: RangeRowProps) {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-[11px] font-semibold text-[#999] text-right shrink-0">{label}</span>
      <DualTrack floor={floor} ceil={ceil} min={value.min} max={value.max} onChange={onChange} />
      <input
        type="number"
        value={value.min}
        min={floor}
        max={value.max}
        onChange={e => onChange({ ...value, min: clamp(Number(e.target.value), floor, value.max) })}
        className="w-[50px] h-7 border border-[#ddd] rounded-[6px] px-1 text-[12px] font-medium text-[#333] text-center outline-none focus:border-[#808088]"
      />
      <span className="text-[11px] text-[#ccc] shrink-0">~</span>
      <input
        type="number"
        value={value.max}
        min={value.min}
        max={ceil}
        onChange={e => onChange({ ...value, max: clamp(Number(e.target.value), value.min, ceil) })}
        className="w-[50px] h-7 border border-[#ddd] rounded-[6px] px-1 text-[12px] font-medium text-[#333] text-center outline-none focus:border-[#808088]"
      />
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function GenerateSettingsPopup({ onClose }: Props) {
  const { groupOrder, groupLabels, baseColors, generateRules, setGenerateRule } = useColorStore();
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

  const handleSave = () => {
    Object.entries(localRules).forEach(([key, rule]) => setGenerateRule(key, rule));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[10px]">
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
                  <RangeRow label="H" floor={0} ceil={360} value={rule.h} onChange={v => updateRule(key, 'h', v)} />
                  <RangeRow label="S" floor={0} ceil={100} value={rule.s} onChange={v => updateRule(key, 's', v)} />
                  <RangeRow label="L" floor={0} ceil={100} value={rule.l} onChange={v => updateRule(key, 'l', v)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex h-[70px] items-center justify-between px-[30px] shrink-0">
          <button
            onClick={handleReset}
            className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[14px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="h-9 w-[90px] bg-[#f5f5f5] rounded-[10px] text-[14px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-9 w-[90px] bg-[#666] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
