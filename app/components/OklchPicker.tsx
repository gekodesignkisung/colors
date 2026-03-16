'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { hexToOKLCH, oklchToHex } from '@/lib/colorUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const C_MAX   = 0.37;
const PAL_W   = 260;
const PAL_H   = 260;
const MARGIN  = 8;
const PICKER_W = 592;
const PICKER_H = 596;

type GamutTarget = 'srgb' | 'p3';

// ─── Color math ───────────────────────────────────────────────────────────────
function oklchToLinRGB(l: number, c: number, h: number) {
  const a  = c * Math.cos((h * Math.PI) / 180);
  const bv = c * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * bv;
  const ll = l_ * l_ * l_;
  const ml = m_ * m_ * m_;
  const sl = s_ * s_ * s_;
  return {
    r:  4.0767416621 * ll - 3.3077115913 * ml + 0.2309699292 * sl,
    g: -1.2684380046 * ll + 2.6097574011 * ml - 0.3413193965 * sl,
    b: -0.0041960863 * ll - 0.7034186147 * ml + 1.7076147010 * sl,
  };
}

function linSRGBtoLinP3(r: number, g: number, b: number) {
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  return {
    r:  2.493497 * X - 0.931384 * Y - 0.402711 * Z,
    g: -0.829489 * X + 1.762664 * Y + 0.023625 * Z,
    b:  0.035846 * X - 0.076172 * Y + 0.956885 * Z,
  };
}

const TOL = 0.0001;
function inGamut(l: number, c: number, h: number, target: GamutTarget): boolean {
  const lin = oklchToLinRGB(l, c, h);
  const ok  = (v: number) => v >= -TOL && v <= 1 + TOL;
  if (target === 'srgb') return ok(lin.r) && ok(lin.g) && ok(lin.b);
  const p3 = linSRGBtoLinP3(lin.r, lin.g, lin.b);
  return ok(p3.r) && ok(p3.g) && ok(p3.b);
}

function maxChromaInGamut(l: number, h: number, target: GamutTarget): number {
  let lo = 0, hi = C_MAX;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(l, mid, h, target)) lo = mid; else hi = mid;
  }
  return lo;
}

const delinearize = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;

function computePos(anchor: { x: number; y: number }) {
  let left = anchor.x + MARGIN;
  let top  = anchor.y + MARGIN;
  if (left + PICKER_W > window.innerWidth  - MARGIN) left = anchor.x - PICKER_W - MARGIN;
  if (top  + PICKER_H > window.innerHeight - MARGIN) top  = anchor.y - PICKER_H - MARGIN;
  return { left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
      aria-pressed={on}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={on ? '/icon-switch-on.svg' : '/icon-switch-off.svg'} alt={on ? 'on' : 'off'} width={32} height={20} />
    </button>
  );
}

// ─── Custom Slider ────────────────────────────────────────────────────────────
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  inputDecimals?: number;
  unit?: string;
  ghostValue?: number; // raw uncorrected value to show as ghost
}

function OklchSlider({ label, value, min, max, step = 0.001, onChange, inputDecimals = 2, unit, ghostValue }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [inputVal, setInputVal] = useState(value.toFixed(inputDecimals));
  const [editing,  setEditing]  = useState(false);

  // sync input when value changes externally (slider drag)
  useEffect(() => {
    if (!editing) setInputVal(value.toFixed(inputDecimals));
  }, [value, inputDecimals, editing]);

  const commit = useCallback((raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  }, [onChange, min, max]);

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const applyPos = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(min + ratio * (max - min));
  }, [min, max, onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) applyPos(e.clientX); };
    const onUp   = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [applyPos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Label + input */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#666', fontFamily: 'Inter, sans-serif' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            min={min} max={max} step={step}
            value={inputVal}
            onChange={e => { setEditing(true); setInputVal(e.target.value); }}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }}
            style={{
              background: 'white', border: '1px solid #ddd', borderRadius: 6,
              height: 28, width: 58, padding: '0 8px',
              fontSize: 13, fontWeight: 500, color: '#333',
              fontFamily: 'Inter, sans-serif', textAlign: 'right',
              outline: 'none', MozAppearance: 'textfield',
            } as React.CSSProperties}
          />
          {unit && (
            <span style={{ fontSize: 10, color: '#ccc', marginLeft: 3, fontFamily: 'Inter, sans-serif' }}>
              {unit}
            </span>
          )}
        </div>
      </div>
      {/* Track */}
      <div
        ref={trackRef}
        style={{ position: 'relative', height: 14, cursor: 'pointer', width: '100%' }}
        onMouseDown={e => { dragging.current = true; applyPos(e.clientX); }}
      >
        <div style={{ position: 'absolute', top: 5, left: 0, right: 0, height: 4, background: '#ddd', borderRadius: 50 }} />
        <div style={{ position: 'absolute', top: 5, left: 0, width: `${pct * 100}%`, height: 4, background: '#808088', borderRadius: 50 }} />
        {/* Ghost thumb — raw uncorrected position */}
        {ghostValue !== undefined && (
          <div style={{
            position: 'absolute', top: -1,
            left: `calc(${Math.max(0, Math.min(1, (ghostValue - min) / (max - min))) * 100}% - 8px)`,
            width: 16, height: 16,
            pointerEvents: 'none',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-ghost-slide.svg" alt="" width={16} height={16} />
          </div>
        )}
        {/* Main thumb — corrected position */}
        <div style={{
          position: 'absolute', top: 0,
          left: `calc(${pct * 100}% - 7px)`,
          width: 14, height: 14, borderRadius: '50%',
          background: 'white', border: '2px solid #808088',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface OklchPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: (savedColor?: string) => void;
  anchorPos?: { x: number; y: number };
}

export default function OklchPicker({ color, onChange, onClose, anchorPos }: OklchPickerProps) {
  const init = hexToOKLCH(color);
  const [l, setL] = useState(init.l);
  const [c, setC] = useState(init.c);
  const [h, setH] = useState(init.h);
  const [gamutTarget,    setGamutTarget]    = useState<GamutTarget>('p3');
  const [showBoundary,   setShowBoundary]   = useState(true);
  const [clipToGamut,    setClipToGamut]    = useState(false);
  const [gamutDropOpen,  setGamutDropOpen]  = useState(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const hueBarRef  = useRef<HTMLDivElement>(null);
  const dragging   = useRef<'palette' | 'hue' | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const originalColor = useRef(color);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (gamutDropOpen && !(e.target as Element).closest('.picker-dropdown')) {
        setGamutDropOpen(false);
      }
    };
    if (gamutDropOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [gamutDropOpen]);

  // ── Palette canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = PAL_W, H = PAL_H;
    const img = ctx.createImageData(W, H);
    const d   = img.data;

    const boundaryPy = new Float32Array(W);
    if (showBoundary) {
      for (let px = 0; px < W; px++) {
        const lv = 1 - px / (W - 1);
        boundaryPy[px] = (1 - maxChromaInGamut(lv, h, gamutTarget) / C_MAX) * (H - 1);
      }
    }

    for (let py = 0; py < H; py++) {
      const cv = (1 - py / (H - 1)) * C_MAX;
      for (let px = 0; px < W; px++) {
        const lv  = 1 - px / (W - 1);
        const lin = oklchToLinRGB(lv, cv, h);
        const rr  = Math.max(0, Math.min(1, delinearize(lin.r)));
        const gg  = Math.max(0, Math.min(1, delinearize(lin.g)));
        const bb  = Math.max(0, Math.min(1, delinearize(lin.b)));
        const idx = (py * W + px) * 4;
        if (showBoundary && py < boundaryPy[px]) {
          const gray = 0.299 * rr + 0.587 * gg + 0.114 * bb;
          const v = Math.round(gray * 80 + 80);
          d[idx] = v; d[idx+1] = v; d[idx+2] = v; d[idx+3] = 255;
        } else {
          d[idx]   = Math.round(rr * 255);
          d[idx+1] = Math.round(gg * 255);
          d[idx+2] = Math.round(bb * 255);
          d[idx+3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    if (showBoundary) {
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        if (px === 0) ctx.moveTo(px, boundaryPy[px]);
        else ctx.lineTo(px, boundaryPy[px]);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        if (px === 0) ctx.moveTo(px, boundaryPy[px]);
        else ctx.lineTo(px, boundaryPy[px]);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [h, gamutTarget, showBoundary]);

  // ── Notify parent ────────────────────────────────────────────────────────────
  useEffect(() => {
    const isOut  = !inGamut(l, c, h, gamutTarget);
    const finalC = clipToGamut && isOut ? maxChromaInGamut(l, h, gamutTarget) : c;
    onChangeRef.current(oklchToHex(l, finalC, h));
  }, [l, c, h, clipToGamut, gamutTarget]);

  // ── Interactions ─────────────────────────────────────────────────────────────
  const handlePaletteDrag = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setL(1 - Math.max(0, Math.min(clientX - rect.left, rect.width))  / rect.width);
    setC((1 - Math.max(0, Math.min(clientY - rect.top, rect.height)) / rect.height) * C_MAX);
  }, []);

  const handleHueDrag = useCallback((clientX: number) => {
    const el = hueBarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setH((Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width) * 360);
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

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isOutOfGamut = !inGamut(l, c, h, gamutTarget);
  const displayC     = clipToGamut && isOutOfGamut ? maxChromaInGamut(l, h, gamutTarget) : c;
  const currentHex   = oklchToHex(l, displayC, h);

  const hueStops = Array.from({ length: 13 }, (_, i) =>
    oklchToHex(0.65, 0.18, (i / 12) * 360)
  ).join(', ');

  const cursorLeft    = `${Math.max(0, Math.min(100, (1 - l) * 100))}%`;
  const cursorTop     = `${Math.max(0, Math.min(100, (1 - displayC / C_MAX) * 100))}%`;
  const rawCursorTop  = `${Math.max(0, Math.min(100, (1 - c / C_MAX) * 100))}%`;
  const isCorrected   = clipToGamut && isOutOfGamut;

  const posStyle = anchorPos
    ? { position: 'fixed' as const, ...computePos(anchorPos), zIndex: 70 }
    : {};

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 12px', height: 36, flexShrink: 0, width: '100%',
  };
  const rowWithBorder: React.CSSProperties = {
    ...rowStyle,
    borderBottom: '1px solid #ddd', paddingBottom: 12,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#666',
    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
  };

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
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>

          {/* Color palette canvas */}
          <div style={{ position: 'relative', width: PAL_W, height: PAL_H, borderRadius: 8, overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              width={PAL_W}
              height={PAL_H}
              style={{ display: 'block', cursor: 'default' }}
              onMouseDown={e => { dragging.current = 'palette'; handlePaletteDrag(e.clientX, e.clientY); }}
            />
            {/* Ghost cursor — raw (uncorrected) position */}
            {isCorrected && (
              <div style={{
                position: 'absolute',
                left: cursorLeft, top: rawCursorTop,
                width: 16, height: 16,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-ghost.svg" alt="" width={16} height={16} />
              </div>
            )}
            {/* Picker cursor — corrected position */}
            <div style={{
              position: 'absolute',
              left: cursorLeft, top: cursorTop,
              width: 16, height: 16, borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              background: currentHex,
              border: '2px solid white',
              boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Hue slider */}
          <div
            ref={hueBarRef}
            style={{
              height: 30, borderRadius: 8, cursor: 'default', position: 'relative',
              background: `linear-gradient(to right, ${hueStops})`,
              flexShrink: 0,
            }}
            onMouseDown={e => { dragging.current = 'hue'; handleHueDrag(e.clientX); }}
          >
            {/* Thumb */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${(h / 360) * 100}%`,
              transform: 'translateX(-50%)',
              width: 3,
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* GAMUT row */}
          <div style={rowStyle}>
            <span style={labelStyle}>GAMUT</span>
            <div style={{ position: 'relative' }} className="picker-dropdown">
              <div
                onClick={() => setGamutDropOpen(v => !v)}
                style={{
                  background: 'white', border: '1px solid #ddd', borderRadius: 10,
                  height: 36,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '0 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                  {gamutTarget === 'srgb' ? 'sRGB' : 'Display P3'}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-bullet-dn.svg" alt="" width={20} height={20} />
              </div>
              {gamutDropOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: 'white', border: '1px solid #ddd', borderRadius: 10,
                  overflow: 'hidden', zIndex: 50,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {(['srgb', 'p3'] as const).map((val) => (
                    <div
                      key={val}
                      onClick={() => { setGamutTarget(val); setGamutDropOpen(false); }}
                      style={{
                        padding: '8px 12px', cursor: 'pointer',
                        fontSize: 14, fontWeight: 500,
                        color: gamutTarget === val ? '#606070' : '#333',
                        background: gamutTarget === val ? '#f5f5f5' : 'transparent',
                      }}
                      onMouseEnter={e => { if (gamutTarget !== val) (e.currentTarget as HTMLElement).style.background = '#f9f9f9'; }}
                      onMouseLeave={e => { if (gamutTarget !== val) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {val === 'srgb' ? 'sRGB' : 'Display P3'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Display Clipping Range toggle */}
          <div style={rowWithBorder}>
            <span style={labelStyle}>Display Clipping Range</span>
            <Toggle on={showBoundary} onToggle={() => setShowBoundary(v => !v)} />
          </div>

          {/* GAMUT Correction toggle */}
          <div style={rowWithBorder}>
            <span style={labelStyle}>GAMUT Correction</span>
            <Toggle on={clipToGamut} onToggle={() => setClipToGamut(v => !v)} />
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
                  const init = hexToOKLCH(originalColor.current);
                  setL(init.l); setC(init.c); setH(init.h);
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

          {/* OKLCH value display */}
          <div style={{
            background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 10,
            height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 12px', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#666', textAlign: 'center' }}>
              L {(l * 100).toFixed(1)}%&nbsp;&nbsp;C {displayC.toFixed(3)}&nbsp;&nbsp;H {h.toFixed(1)}°
            </span>
          </div>

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OklchSlider
              label="Lightness"
              value={l * 100}
              min={0} max={100} step={0.1}
              onChange={v => setL(v / 100)}
              inputDecimals={1}
              unit="%"
            />
            <OklchSlider
              label="Chroma"
              value={displayC}
              min={0} max={C_MAX} step={0.001}
              onChange={setC}
              inputDecimals={3}
              ghostValue={isCorrected ? c : undefined}
            />
            <OklchSlider
              label="Hue"
              value={h}
              min={0} max={360} step={0.1}
              onChange={setH}
              inputDecimals={1}
              unit="°"
            />
          </div>

          {/* Out-of-gamut warning / correction notice */}
          {isOutOfGamut && (
            <div style={{
              fontSize: 11, fontWeight: 500,
              borderRadius: 6, padding: '5px 10px',
              ...(isCorrected
                ? { color: '#4f86c6', background: '#eff6ff', border: '1px solid #bfdbfe' }
                : { color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a' }
              ),
            }}>
              {isCorrected ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 14, height: 14, borderRadius: '50%',
                    border: '1.5px solid #4f86c6', color: '#4f86c6',
                    fontSize: 9, fontWeight: 700, lineHeight: 1, flexShrink: 0,
                  }}>!</span>
                  {`Corrected to ${gamutTarget === 'srgb' ? 'sRGB' : 'Display P3'} boundary`}
                </span>
              ) : `⚠ Out of ${gamutTarget === 'srgb' ? 'sRGB' : 'Display P3'} gamut`}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        padding: '0 24px 24px', gap: 10,
      }}>
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
            onClick={() => onClose(currentHex)}
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
