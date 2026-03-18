'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { hexToHSL, hslToHex, hslToHSV, hsvToHSL, hsvToHex, rgbToHsl } from '@/lib/colorUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAL_W   = 260;
const PAL_H   = 260;
const MARGIN  = 8;
const PICKER_W = 592;
const PICKER_H = 500;

function computePos(anchor: { x: number; y: number }) {
  let left = anchor.x + MARGIN;
  let top  = anchor.y + MARGIN;
  if (left + PICKER_W > window.innerWidth  - MARGIN) left = anchor.x - PICKER_W - MARGIN;
  if (top  + PICKER_H > window.innerHeight - MARGIN) top  = anchor.y - PICKER_H - MARGIN;
  return { left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) };
}

function hsvToRgb(h: number, s: number, v: number) {
  const sv = s / 100, vv = v / 100;
  const hh = h % 360;
  const c = vv * sv;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  let r = 0, g = 0, b = 0;
  if (hh < 60)       { r = c; g = x; b = 0; }
  else if (hh < 120) { r = x; g = c; b = 0; }
  else if (hh < 180) { r = 0; g = c; b = x; }
  else if (hh < 240) { r = 0; g = x; b = c; }
  else if (hh < 300) { r = x; g = 0; b = c; }
  else               { r = c; g = 0; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

// ─── Channel input (RGB / HSV) ────────────────────────────────────────────────
function ChannelInput({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(Math.round(value)));
  const active = useRef(false);

  useEffect(() => {
    if (!active.current) setLocal(String(Math.round(value)));
  }, [value]);

  const commit = (raw: string) => {
    active.current = false;
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    else setLocal(String(Math.round(value)));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <div style={{
        border: '1px solid #ddd', borderRadius: 8, height: 36,
        display: 'flex', alignItems: 'center', padding: '0 4px', width: '100%', boxSizing: 'border-box',
      }}>
        <input
          type="number" min={min} max={max} value={local}
          onChange={e => { active.current = true; setLocal(e.target.value); }}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, fontWeight: 600, color: '#333',
            fontFamily: 'Inter, sans-serif', textAlign: 'center',
            MozAppearance: 'textfield',
          } as React.CSSProperties}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: '#999' }}>{label}</span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: (savedColor?: string) => void;
  anchorPos?: { x: number; y: number };
}

export default function ColorPicker({ color, onChange, onClose, anchorPos }: ColorPickerProps) {
  const initialHsl = hexToHSL(color);
  const initialHsv = hslToHSV(initialHsl.h, initialHsl.s, initialHsl.l);

  const [hsv, setHsv] = useState(initialHsv);
  const originalColor = useRef(color);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsv'>('hex');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [editing, setEditing] = useState(false);

  const paletteRef = useRef<HTMLDivElement>(null);
  const hueRef     = useRef<HTMLDivElement>(null);
  const dragging   = useRef<'palette' | 'hue' | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Derived color ─────────────────────────────────────────────────────────
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

  // ── Notify parent ─────────────────────────────────────────────────────────
  useEffect(() => {
    onChangeRef.current(currentHex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsv.h, hsv.s, hsv.v]);

  // ── Interactions ──────────────────────────────────────────────────────────
  const handlePaletteDrag = useCallback((clientX: number, clientY: number) => {
    const el = paletteRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100);
    const v = Math.round((1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))) * 100);
    setHsv(prev => ({ ...prev, s, v }));
  }, []);

  const handleHueDrag = useCallback((clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.min(Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 360), 360);
    setHsv(prev => ({ ...prev, h }));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === 'palette') handlePaletteDrag(e.clientX, e.clientY);
      if (dragging.current === 'hue')     handleHueDrag(e.clientX);
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [handlePaletteDrag, handleHueDrag]);

  // ── Dropdown close-on-outside ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isDropdownOpen && !(e.target as Element).closest('.picker-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);

  // ── Value input helpers ───────────────────────────────────────────────────
  const getDisplayValue = useCallback(() => {
    if (colorFormat === 'hex') return currentHex.replace('#', '').toUpperCase();
    if (colorFormat === 'rgb') return `${currentRgb.r} ${currentRgb.g} ${currentRgb.b}`;
    return `${Math.round(hsv.h)} ${Math.round(hsv.s)} ${Math.round(hsv.v)}`;
  }, [colorFormat, currentHex, currentRgb, hsv]);

  // sync display when not editing
  useEffect(() => {
    if (!editing) setInputVal(getDisplayValue());
  }, [editing, getDisplayValue]);

  const applyInput = useCallback((raw: string) => {
    const v = raw.trim();
    if (colorFormat === 'hex') {
      const clean = v.replace(/^#/, '');
      if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
        const hsl = hexToHSL('#' + clean);
        setHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
      }
    } else if (colorFormat === 'rgb') {
      const m = v.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
      if (m) {
        const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        if (r <= 255 && g <= 255 && b <= 255) {
          const hsl = rgbToHsl(r, g, b);
          setHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
        }
      }
    } else {
      const m = v.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
      if (m) {
        const h = parseInt(m[1]), s = parseInt(m[2]), vv = parseInt(m[3]);
        if (h <= 360 && s <= 100 && vv <= 100) setHsv({ h, s, v: vv });
      }
    }
  }, [colorFormat]);

  const commitInput = useCallback((raw: string) => {
    applyInput(raw);
    setEditing(false);
  }, [applyInput]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const posStyle = anchorPos
    ? { position: 'fixed' as const, ...computePos(anchorPos), zIndex: 70 }
    : {};

  return (
    <div
      style={{
        width: PICKER_W, background: 'white', borderRadius: 20,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', fontFamily: 'Inter, sans-serif',
        ...posStyle,
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, padding: 24 }}>

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div style={{ width: PAL_W, display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>

          {/* HSV 2D Palette */}
          <div
            ref={paletteRef}
            style={{ position: 'relative', width: PAL_W, height: PAL_H, borderRadius: 8, overflow: 'hidden', cursor: 'default' }}
            onMouseDown={e => { dragging.current = 'palette'; handlePaletteDrag(e.clientX, e.clientY); }}
          >
            {/* Base hue */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `hsl(${hsv.h}, 100%, 50%)`,
            }} />
            {/* White → transparent (saturation) */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, white, transparent)',
            }} />
            {/* Black overlay (value) */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, black, transparent)',
            }} />
            {/* Cursor */}
            <div style={{
              position: 'absolute',
              left: `${hsv.s}%`, top: `${100 - hsv.v}%`,
              transform: 'translate(-50%, -50%)',
              width: 16, height: 16, borderRadius: '50%',
              background: currentHex,
              border: '2px solid white',
              boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Hue slider */}
          <div
            ref={hueRef}
            style={{
              height: 30, borderRadius: 8, cursor: 'default', position: 'relative',
              background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%), hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%), hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%), hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%), hsl(360,100%,50%))',
              flexShrink: 0,
            }}
            onMouseDown={e => { dragging.current = 'hue'; handleHueDrag(e.clientX); }}
          >
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${(hsv.h / 360) * 100}%`,
              transform: 'translateX(-50%)',
              width: 3,
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Swatch + X */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Color boxes: left = current, right = original */}
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80,
                borderRadius: '10px 0 0 10px',
                background: currentHex,
              }} />
              <div
                onClick={() => {
                  const hsl = hexToHSL(originalColor.current);
                  setHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
                }}
                style={{
                  width: 80, height: 80,
                  borderRadius: '0 10px 10px 0',
                  background: originalColor.current,
                  cursor: 'pointer',
                }}
              />
            </div>
            <button
              onClick={() => { onChangeRef.current(originalColor.current); onClose(); }}
              style={{
                width: 24, height: 24, background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-close.svg" alt="Close" width={20} height={20} />
            </button>
          </div>

          {/* Value input */}
          {colorFormat === 'hex' ? (
            <div style={{
              background: '#fff', border: '1px solid #ddd', borderRadius: 10,
              height: 36, display: 'flex', alignItems: 'center',
              padding: '0 12px', gap: 6, flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#999', userSelect: 'none' }}>#</span>
              <input
                type="text"
                value={editing ? inputVal : getDisplayValue()}
                onChange={e => { setEditing(true); setInputVal(e.target.value); }}
                onFocus={() => { setEditing(true); setInputVal(getDisplayValue()); }}
                onBlur={e => commitInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    applyInput((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, fontWeight: 600, color: '#333',
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder="RRGGBB"
              />
            </div>
          ) : colorFormat === 'rgb' ? (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <ChannelInput label="R" value={currentRgb.r} min={0} max={255} onChange={r => {
                const hsl = rgbToHsl(r, currentRgb.g, currentRgb.b);
                setHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
              }} />
              <ChannelInput label="G" value={currentRgb.g} min={0} max={255} onChange={g => {
                const hsl = rgbToHsl(currentRgb.r, g, currentRgb.b);
                setHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
              }} />
              <ChannelInput label="B" value={currentRgb.b} min={0} max={255} onChange={b => {
                const hsl = rgbToHsl(currentRgb.r, currentRgb.g, b);
                setHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
              }} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <ChannelInput label="H" value={hsv.h} min={0} max={360} onChange={h => setHsv(prev => ({ ...prev, h }))} />
              <ChannelInput label="S" value={hsv.s} min={0} max={100} onChange={s => setHsv(prev => ({ ...prev, s }))} />
              <ChannelInput label="V" value={hsv.v} min={0} max={100} onChange={v => setHsv(prev => ({ ...prev, v }))} />
            </div>
          )}

          {/* Format dropdown */}
          <div className="picker-dropdown" style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => setIsDropdownOpen(v => !v)}
              style={{
                background: 'white', border: '1px solid #ddd', borderRadius: 10,
                height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 12px', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{colorFormat.toUpperCase()}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-bullet-dn.svg" alt="" width={20} height={20} />
            </div>
            {isDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'white', border: '1px solid #ddd', borderRadius: 10,
                overflow: 'hidden', zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}>
                {(['hex', 'rgb', 'hsv'] as const).map(fmt => (
                  <div
                    key={fmt}
                    onClick={() => { setColorFormat(fmt); setIsDropdownOpen(false); setEditing(false); }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer',
                      fontSize: 14, fontWeight: 500,
                      color: colorFormat === fmt ? '#606070' : '#333',
                      background: colorFormat === fmt ? '#f5f5f5' : 'transparent',
                      }}
                    onMouseEnter={e => { if (colorFormat !== fmt) (e.currentTarget as HTMLElement).style.background = '#f9f9f9'; }}
                    onMouseLeave={e => { if (colorFormat !== fmt) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {fmt.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, width: 260 }}>
          <button
            onClick={() => { onChangeRef.current(originalColor.current); onClose(); }}
            style={{
              flex: 1, height: 36, borderRadius: 10, border: 'none',
              background: '#f5f5f5', color: '#808088',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const hsl = hsvToHSL(hsv.h, hsv.s, hsv.v);
              onClose(hslToHex(hsl.h, hsl.s, hsl.l));
            }}
            style={{
              flex: 1, height: 36, borderRadius: 10, border: 'none',
              background: '#606070', color: 'white',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
