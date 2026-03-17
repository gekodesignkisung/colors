'use client';

import { useRef } from 'react';

export interface DualTrackProps {
  floor: number;
  ceil: number;
  min: number;
  max: number;
  onChange: (v: { min: number; max: number }) => void;
}

export function DualTrack({ floor, ceil, min, max, onChange }: DualTrackProps) {
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

export interface SingleTrackProps {
  floor: number;
  ceil: number;
  value: number;
  onChange: (v: number) => void;
}

export function SingleTrack({ floor, ceil, value, onChange }: SingleTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pct = Math.max(0, Math.min(100, ((value - floor) / (ceil - floor)) * 100));

  const valueFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(floor + ratio * (ceil - floor));
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    onChange(valueFromClientX(e.clientX));
    const onMove = (ev: MouseEvent) => { if (dragging.current) onChange(valueFromClientX(ev.clientX)); };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={trackRef}
      className="w-full relative h-[14px] cursor-pointer"
      onMouseDown={startDrag}
    >
      {/* Track background */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[4px] bg-[#f0f0f0] rounded-full pointer-events-none" />
      {/* Filled */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 h-[4px] bg-[#808088] rounded-full pointer-events-none" style={{ width: `${pct}%` }} />
      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-white border-2 border-[#808088] cursor-grab shadow-sm hover:scale-110 transition-transform pointer-events-none"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

export interface RangeRowProps {
  label: string;
  floor: number;
  ceil: number;
  value: { min: number; max: number };
  onChange: (v: { min: number; max: number }) => void;
  unit?: string;
}

export function RangeRow({ label, floor, ceil, value, onChange, unit }: RangeRowProps) {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-[11px] font-semibold text-[#999] text-right shrink-0">{label}</span>
      <DualTrack floor={floor} ceil={ceil} min={value.min} max={value.max} onChange={onChange} />
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            value={value.min}
            min={floor}
            max={value.max}
            onChange={e => onChange({ ...value, min: clamp(Number(e.target.value), floor, value.max) })}
            className="w-[50px] h-7 border border-[#ddd] rounded-[6px] text-[13px] font-medium text-[#333] text-right outline-none focus:border-[#808088]" style={{ padding: '0 8px' }}
          />
          {unit && <span className="text-[10px] text-[#ccc] w-[12px] shrink-0">{unit}</span>}
        </div>
        <span className="text-[11px] text-[#ccc] shrink-0">~</span>
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            value={value.max}
            min={value.min}
            max={ceil}
            onChange={e => onChange({ ...value, max: clamp(Number(e.target.value), value.min, ceil) })}
            className="w-[50px] h-7 border border-[#ddd] rounded-[6px] text-[13px] font-medium text-[#333] text-right outline-none focus:border-[#808088]" style={{ padding: '0 8px' }}
          />
          {unit && <span className="text-[10px] text-[#ccc] w-[12px] shrink-0">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
