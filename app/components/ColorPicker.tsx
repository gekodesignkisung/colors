'use client';

import { useState, useRef, useEffect } from 'react';
import { hexToHSL, hslToHex, hslToHSV, hsvToHSL, hsvToHex, rgbToHsl } from '@/lib/colorUtils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: (savedColor?: string) => void;
  anchorPos?: { x: number; y: number };
}

const PICKER_W = 260;
const PICKER_H = 502; // palette(260) + sliders(72) + preview(120) + buttons(50)
const MARGIN = 8;

function computePos(anchor: { x: number; y: number }) {
  let left = anchor.x + MARGIN;
  let top  = anchor.y + MARGIN;
  if (left + PICKER_W > window.innerWidth  - MARGIN) left = anchor.x - PICKER_W - MARGIN;
  if (top  + PICKER_H > window.innerHeight - MARGIN) top  = anchor.y - PICKER_H - MARGIN;
  return { left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) };
}

export default function ColorPicker({ color, onChange, onClose, anchorPos }: ColorPickerProps) {
  const initialHsl = hexToHSL(color);
  const initialHsv = hslToHSV(initialHsl.h, initialHsl.s, initialHsl.l);

  const [tempHsv, setTempHsv] = useState(initialHsv);
  const [tempRgb, setTempRgb] = useState<{ r: number; g: number; b: number }>({ r: 0, g: 0, b: 0 });
  const [isDraggingPalette, setIsDraggingPalette] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingSaturation, setIsDraggingSaturation] = useState(false);
  const [isDraggingValue, setIsDraggingValue] = useState(false);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsv'>('hex');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const paletteRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const saturationRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  const tempRgbRef = useRef(tempRgb);

  const getCurrentRgb = () => {
    if (colorFormat === 'rgb') return tempRgb;
    const h = tempHsv.h % 360;
    const s = tempHsv.s / 100;
    const v = tempHsv.v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60)        { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
    else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
    else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
    else if (300 <= h && h < 360){ r = c; g = 0; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  };

  const updateRedHorizontal   = (e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const r = Math.round((x / rect.width) * 255);
    const rgb = tempRgbRef.current;
    setTempRgb({ r, g: rgb.g, b: rgb.b });
  };
  const updateGreenHorizontal = (e: MouseEvent | React.MouseEvent) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const g = Math.round((x / rect.width) * 255);
    const rgb = tempRgbRef.current;
    setTempRgb({ r: rgb.r, g, b: rgb.b });
  };
  const updateBlueHorizontal  = (e: MouseEvent | React.MouseEvent) => {
    if (!valueRef.current) return;
    const rect = valueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const b = Math.round((x / rect.width) * 255);
    const rgb = tempRgbRef.current;
    setTempRgb({ r: rgb.r, g: rgb.g, b });
  };

  const updatePalettePosition = (e: MouseEvent | React.MouseEvent) => {
    if (!paletteRef.current) return;
    const rect = paletteRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setTempHsv(prev => ({ ...prev, s: Math.round((x / rect.width) * 100), v: Math.round(100 - (y / rect.height) * 100) }));
  };
  const updateHuePosition = (e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setTempHsv(prev => ({ ...prev, h: Math.min(Math.round((x / rect.width) * 360), 360) }));
  };
  const updateSaturationPosition = (e: MouseEvent | React.MouseEvent) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setTempHsv(prev => ({ ...prev, s: Math.round((x / rect.width) * 100) }));
  };
  const updateValuePosition = (e: MouseEvent | React.MouseEvent) => {
    if (!valueRef.current) return;
    const rect = valueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setTempHsv(prev => ({ ...prev, v: Math.round((x / rect.width) * 100) }));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPalette && colorFormat !== 'rgb') updatePalettePosition(e);
      if (colorFormat === 'rgb') {
        if (isDraggingHue) updateRedHorizontal(e);
        if (isDraggingSaturation) updateGreenHorizontal(e);
        if (isDraggingValue) updateBlueHorizontal(e);
      } else {
        if (isDraggingHue) updateHuePosition(e);
        if (isDraggingSaturation) updateSaturationPosition(e);
        if (isDraggingValue) updateValuePosition(e);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingPalette(false);
      setIsDraggingHue(false);
      setIsDraggingSaturation(false);
      setIsDraggingValue(false);
    };
    if (isDraggingPalette || isDraggingHue || isDraggingSaturation || isDraggingValue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingPalette, isDraggingHue, isDraggingSaturation, isDraggingValue, tempHsv, colorFormat, tempRgb]);

  useEffect(() => {
    if (colorFormat === 'rgb') {
      const h = tempHsv.h % 360;
      const s = tempHsv.s / 100;
      const v = tempHsv.v / 100;
      const c = v * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = v - c;
      let r = 0, g = 0, b = 0;
      if (0 <= h && h < 60)        { r = c; g = x; b = 0; }
      else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
      else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
      else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
      else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
      else if (300 <= h && h < 360){ r = c; g = 0; b = x; }
      setTempRgb({ r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) });
    }
  }, [colorFormat, tempHsv]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.picker-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const hsl = hsvToHSL(tempHsv.h, tempHsv.s, tempHsv.v);
    onChangeRef.current(hslToHex(hsl.h, hsl.s, hsl.l));
  }, [tempHsv.h, tempHsv.s, tempHsv.v]);

  useEffect(() => { tempRgbRef.current = tempRgb; }, [tempRgb]);

  useEffect(() => {
    if (colorFormat === 'rgb') {
      const hex = `#${((tempRgb.r << 16) | (tempRgb.g << 8) | tempRgb.b).toString(16).padStart(6, '0').toUpperCase()}`;
      onChangeRef.current(hex);
    }
  }, [tempRgb, colorFormat]);

  const currentColor = colorFormat === 'rgb'
    ? `#${((tempRgb.r << 16) | (tempRgb.g << 8) | tempRgb.b).toString(16).padStart(6, '0').toUpperCase()}`
    : hsvToHex(tempHsv.h, tempHsv.s, tempHsv.v);

  const getDisplayValue = () => {
    if (colorFormat === 'hex') return currentColor.toUpperCase().replace('#', '');
    if (colorFormat === 'rgb') return `R${tempRgb.r} G${tempRgb.g} B${tempRgb.b}`;
    return `hsv(${Math.round(tempHsv.h)}, ${Math.round(tempHsv.s)}%, ${Math.round(tempHsv.v)}%)`;
  };

  const handleSave = () => {
    const hsl = hsvToHSL(tempHsv.h, tempHsv.s, tempHsv.v);
    onClose(hslToHex(hsl.h, hsl.s, hsl.l));
  };

  const posStyle = anchorPos
    ? { position: 'fixed' as const, ...computePos(anchorPos), zIndex: 70 }
    : {};

  return (
    <div
      className="w-[260px] flex flex-col overflow-hidden shadow-2xl"
      style={{ borderRadius: 10, ...posStyle }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* 2D HSV 팔레트 / RGB 모드 */}
      {colorFormat === 'rgb' ? (
        <div className="flex flex-col w-[260px]">
          {/* Red */}
          <div
            ref={hueRef}
            className="relative w-full h-[80px] cursor-pointer"
            style={{ background: 'linear-gradient(to right, #000000, #ff0000)' }}
            onMouseDown={() => setIsDraggingHue(true)}
          >
            <div className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-50"
              style={{ left: `${(getCurrentRgb().r / 255) * 100}%`, transform: 'translateX(-50%)' }} />
          </div>
          {/* Green */}
          <div
            ref={saturationRef}
            className="relative w-full h-[80px] cursor-pointer"
            style={{ background: 'linear-gradient(to right, #000000, #00ff00)' }}
            onMouseDown={() => setIsDraggingSaturation(true)}
          >
            <div className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-50"
              style={{ left: `${(getCurrentRgb().g / 255) * 100}%`, transform: 'translateX(-50%)' }} />
          </div>
          {/* Blue */}
          <div
            ref={valueRef}
            className="relative w-full h-[80px] cursor-pointer"
            style={{ background: 'linear-gradient(to right, #000000, #0000ff)' }}
            onMouseDown={() => setIsDraggingValue(true)}
          >
            <div className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-50"
              style={{ left: `${(getCurrentRgb().b / 255) * 100}%`, transform: 'translateX(-50%)' }} />
          </div>
        </div>
      ) : (
        <div
          ref={paletteRef}
          className="relative w-[260px] h-[260px] overflow-visible cursor-crosshair"
          onMouseDown={e => { setIsDraggingPalette(true); updatePalettePosition(e); }}
        >
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(to right, hsl(${tempHsv.h}, 100%, 100%), hsl(${tempHsv.h}, 100%, 50%))` }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, hsl(0, 0%, 0%), transparent)' }} />
          <div className="absolute w-[8px] h-[8px] border-[2px] border-white pointer-events-none z-50"
            style={{ left: `${tempHsv.s}%`, top: `${100 - tempHsv.v}%`, transform: 'translate(-50%, -50%)' }} />
        </div>
      )}

      {/* HSV 슬라이더 (RGB 모드 제외) */}
      {colorFormat !== 'rgb' && (
        <>
          <div ref={hueRef} className="relative w-[260px] h-[24px] cursor-pointer"
            style={{ background: 'linear-gradient(to right, hsl(0,100%,50%) 0%, hsl(60,100%,50%) 16.67%, hsl(120,100%,50%) 33.33%, hsl(180,100%,50%) 50%, hsl(240,100%,50%) 66.67%, hsl(300,100%,50%) 83.33%, hsl(360,100%,50%) 100%)' }}
            onMouseDown={e => { setIsDraggingHue(true); updateHuePosition(e); }}>
            <div className="absolute w-[2px] h-[24px] bg-white pointer-events-none z-50"
              style={{ left: `${(tempHsv.h / 360) * 100}%`, transform: 'translateX(-50%)' }} />
          </div>
          <div ref={saturationRef} className="relative w-[260px] h-[24px] cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(${tempHsv.h}, 0%, 50%), hsl(${tempHsv.h}, 100%, 50%))` }}
            onMouseDown={e => { setIsDraggingSaturation(true); updateSaturationPosition(e); }}>
            <div className="absolute w-[2px] h-[24px] bg-white pointer-events-none z-50"
              style={{ left: `${tempHsv.s}%`, transform: 'translateX(-50%)' }} />
          </div>
          <div ref={valueRef} className="relative w-[260px] h-[24px] cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(${tempHsv.h}, ${tempHsv.s}%, 0%), hsl(${tempHsv.h}, ${tempHsv.s}%, 100%))` }}
            onMouseDown={e => { setIsDraggingValue(true); updateValuePosition(e); }}>
            <div className="absolute w-[2px] h-[24px] bg-white pointer-events-none z-50"
              style={{ left: `${tempHsv.v}%`, transform: 'translateX(-50%)' }} />
          </div>
        </>
      )}

      {/* 컬러 프리뷰 + 포맷 선택 */}
      <div className="w-[260px] flex gap-[20px] items-center justify-center p-[20px] bg-white">
        <div className="shrink-0 size-[80px]"
          style={{
            backgroundColor: currentColor,
            border: currentColor.toLowerCase() === '#ffffff' ? '1px solid #dddddd' : 'none'
          }} />
        <div className="flex flex-[1_0_0] flex-col gap-[10px] items-center min-w-0">
          {/* 포맷 드롭다운 */}
          <div className="relative picker-dropdown w-[120px]">
            <div
              className="bg-white border border-[#b1b6bf] flex gap-[4px] h-[30px] items-center px-[8px] w-full cursor-pointer shadow-[0px_1px_2px_0px_rgba(5,32,81,0.05)]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="flex-1 font-medium text-[#010814] text-[14px]">{colorFormat.toUpperCase()}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src="/icon-bullet.svg" className="w-4 h-4" />
            </div>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full bg-white border border-[#b1b6bf] border-t-0 shadow-[0px_1px_2px_0px_rgba(5,32,81,0.05)] z-50">
                {(['hex', 'rgb', 'hsv'] as const).map(fmt => (
                  <div key={fmt} className="px-[8px] py-[6px] hover:bg-gray-100 cursor-pointer font-medium text-[#010814] text-[14px]"
                    onClick={() => { setColorFormat(fmt); setIsDropdownOpen(false); }}>
                    {fmt.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 값 입력창 */}
          <div className="bg-[#e6e7ea] flex items-center justify-center px-[4px] w-[120px] h-[36px]">
            {colorFormat === 'hex' && <span className="font-medium text-[14px] text-[#354259] ml-[4px] mr-[-2px]">#</span>}
            <input
              type="text"
              value={isEditing ? inputValue : getDisplayValue()}
              onChange={e => {
                const v = e.target.value;
                if (colorFormat === 'hex' && /^[0-9A-Fa-f]*$/.test(v) && v.length <= 6) setInputValue(v);
                else setInputValue(v);
              }}
              onFocus={() => { setIsEditing(true); setInputValue(getDisplayValue()); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = inputValue.trim();
                  if (colorFormat === 'hex' && /^[0-9A-Fa-f]{6}$/i.test(v)) {
                    const hsl = hexToHSL('#' + v);
                    setTempHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
                  } else if (colorFormat === 'rgb') {
                    const m = v.match(/^R?\s*(\d{1,3})\s+G?\s*(\d{1,3})\s+B?\s*(\d{1,3})$/i);
                    if (m) {
                      const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
                      if (r <= 255 && g <= 255 && b <= 255) {
                        const hsl = rgbToHsl(r, g, b);
                        setTempHsv(hslToHSV(hsl.h, hsl.s, hsl.l));
                      }
                    }
                  } else if (colorFormat === 'hsv') {
                    const m = v.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
                    if (m) {
                      const h = parseInt(m[1]), s = parseInt(m[2]), vv = parseInt(m[3]);
                      if (h <= 360 && s <= 100 && vv <= 100) setTempHsv({ h, s, v: vv });
                    }
                  }
                  setIsEditing(false);
                  e.currentTarget.blur();
                }
              }}
              onBlur={() => setIsEditing(false)}
              className="bg-transparent text-center font-medium text-[14px] text-[#354259] border-none outline-none w-full"
              placeholder={colorFormat === 'hex' ? 'FFFFFF' : ''}
            />
          </div>
        </div>
      </div>

      {/* Cancel / OK */}
      <div className="flex w-[260px]">
        <button type="button" onClick={() => onClose()}
          className="w-[130px] h-[50px] hover:bg-gray-700 transition-all duration-200 cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: '#888' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-picker-cancel.svg" alt="Cancel" className="w-[40px] h-[40px] hover:scale-[1.2] transition-all duration-200" />
        </button>
        <button type="button" onClick={handleSave}
          className="w-[130px] h-[50px] hover:bg-gray-700 transition-all duration-200 cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: '#999' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-picker-ok.svg" alt="OK" className="w-[40px] h-[40px] hover:scale-[1.2] transition-all duration-200" />
        </button>
      </div>
    </div>
  );
}
