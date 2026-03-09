'use client';

import { useEffect, useRef, useState } from 'react';
import { hexToHSL, hexToOKLCH, isValidHex, normalizeHex } from '@/lib/colorUtils';
import { ColorShape } from '@/app/components/ColorShape';
import ColorPicker from '@/app/components/ColorPicker';
import { RangeRow } from '@/app/components/RangeRow';
import { useColorStore, DEFAULT_GENERATE_RULE } from '@/store/colorStore';
import { buildFormulaString } from '@/lib/generateTokens';
import { KeyColorGenSettings, KeyColorAutoSettings, OpGenSettings, RangeGenSettings } from '@/types/tokens';

interface KeyColorEditPopupProps {
  colorKey: string;
  initialHex: string;
  initialLabel: string;
  initialDescription: string;
  isCore: boolean;
  globalGenerationMode: 'manual' | 'auto';
  onSave: (hex: string, label: string, desc: string) => void;
  onClose: () => void;
  onRemove?: () => void;
}

const OPERATION_BUTTONS = [
  { label: 'Source',     value: 'source',       group: 0, hasParam: false, max: 0   },
  { label: 'Grayscale',  value: 'grayscale',    group: 0, hasParam: false, max: 0   },
  { label: 'Invert',     value: 'invert',       group: 0, hasParam: false, max: 0   },
  { label: 'Contrast',   value: 'contrast',     group: 1, hasParam: false, max: 0   },
  { label: 'Lightness',  value: 'setLightness', group: 1, hasParam: true,  max: 100 },
  { label: 'Saturation', value: 'setSaturation',group: 1, hasParam: true,  max: 100 },
  { label: 'Color Shift',value: 'colorShift',   group: 2, hasParam: true,  max: 360 },
  { label: 'Lighten (+)',value: 'lighten',       group: 2, hasParam: true,  max: 100 },
  { label: 'Darken (−)', value: 'darken',        group: 2, hasParam: true,  max: 100 },
];

export default function KeyColorEditPopup({
  colorKey,
  initialHex,
  initialLabel,
  initialDescription,
  isCore,
  globalGenerationMode,
  onSave,
  onClose,
  onRemove,
}: KeyColorEditPopupProps) {
  const [hex,   setHex]   = useState(initialHex);
  const [label, setLabel] = useState(initialLabel);
  const [desc,  setDesc]  = useState(initialDescription);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos,  setPickerPos]  = useState<{ x: number; y: number } | null>(null);
  const [localGenSettings, setLocalGenSettings] = useState<KeyColorGenSettings | null>(null);
  const [showToast, setShowToast] = useState(false);

  const popupRef  = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const { keyGenSettings, setKeyGenSettings, recomputeDerivedColor, groupLabels, groupOrder, setDefaultKeyGenSettings, useOklch } = useColorStore();
  const settings = keyGenSettings[colorKey];
  const currentSettings = localGenSettings || settings;

  useEffect(() => {
    setHex(initialHex);
    setLabel(initialLabel);
    setDesc(initialDescription);
    setLocalGenSettings(null);
  }, [colorKey, initialHex, initialLabel, initialDescription]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handlePickerChange = (newHex: string) => setHex(newHex);
  const handlePickerClose = (savedHex?: string) => {
    if (savedHex) setHex(savedHex);
    setShowPicker(false);
  };

  const handleSave = () => {
    const finalHex = isValidHex(hex) ? normalizeHex(hex) : initialHex;
    const finalLabel = label.trim() || initialLabel;
    if (localGenSettings) {
      setKeyGenSettings(colorKey, localGenSettings);
      recomputeDerivedColor(colorKey);
    }
    onSave(finalHex, finalLabel, desc);
    onClose();
  };

  const handleCancel = () => { setLocalGenSettings(null); onClose(); };
  const handleRemove = () => { onRemove?.(); handleCancel(); };

  const handleReset = () => {
    const defaults: Record<string, KeyColorGenSettings> = {
      primary:   { mode: 'manual', autoSettings: { kind: 'range', rule: { ...DEFAULT_GENERATE_RULE } } },
      secondary: { mode: 'auto',   autoSettings: { kind: 'operation', sourceKey: 'primary', operation: 'colorShift', param: 60 } },
      tertiary:  { mode: 'auto',   autoSettings: { kind: 'operation', sourceKey: 'primary', operation: 'colorShift', param: 120 } },
      neutral:   { mode: 'auto',   autoSettings: { kind: 'range', rule: { h:{min:0,max:360}, s:{min:0,max:15}, l:{min:20,max:75} } } },
    };
    setKeyGenSettings(colorKey, defaults[colorKey] || defaults.primary);
  };

  const handleSetAsDefault = () => {
    if (currentSettings) {
      if (localGenSettings) {
        setKeyGenSettings(colorKey, localGenSettings);
        recomputeDerivedColor(colorKey);
      }
      setDefaultKeyGenSettings(colorKey, currentSettings);
      setShowToast(true);
    }
  };

  const handleSourceChange = (sourceKey: string) => {
    if (!currentSettings || currentSettings.autoSettings.kind !== 'operation') return;
    setLocalGenSettings({ mode: 'auto', autoSettings: { ...(currentSettings.autoSettings as OpGenSettings), sourceKey } });
  };

  const handleOperationChange = (operation: string) => {
    if (!currentSettings || currentSettings.autoSettings.kind !== 'operation') return;
    const opSettings = currentSettings.autoSettings as OpGenSettings;
    const btn = OPERATION_BUTTONS.find(b => b.value === operation);
    setLocalGenSettings({ mode: 'auto', autoSettings: { ...opSettings, operation: operation as any, param: opSettings.param || (btn?.max ?? 50) } });
  };

  const handleParamChange = (param: number) => {
    if (!currentSettings || currentSettings.autoSettings.kind !== 'operation') return;
    setLocalGenSettings({ mode: 'auto', autoSettings: { ...(currentSettings.autoSettings as OpGenSettings), param } as KeyColorAutoSettings });
  };

  const handleRangeChange = (channel: 'h' | 's' | 'l', value: { min: number; max: number }) => {
    if (!currentSettings || currentSettings.autoSettings.kind !== 'range') return;
    const rangeSettings = currentSettings.autoSettings as RangeGenSettings;
    setLocalGenSettings({ mode: 'auto', autoSettings: { kind: 'range', rule: { ...rangeSettings.rule, [channel]: value } } });
  };

  const displayHex = isValidHex(hex) ? normalizeHex(hex) : hex;
  const isPrimary = colorKey === 'primary';
  const isNeutral = colorKey === 'neutral';
  const isOperationBased = !isPrimary && !isNeutral;

  const opSettings = currentSettings?.autoSettings.kind === 'operation' ? (currentSettings.autoSettings as OpGenSettings) : null;
  const rangeSettings = currentSettings?.autoSettings.kind === 'range' ? (currentSettings.autoSettings as RangeGenSettings) : null;
  const sourceLabel = opSettings ? groupLabels[opSettings.sourceKey] ?? opSettings.sourceKey : '';
  const currentOpBtn = opSettings ? OPERATION_BUTTONS.find(b => b.value === opSettings.operation) : null;

  // Sync slider fill CSS variable
  useEffect(() => {
    if (!sliderRef.current || !opSettings) return;
    const max = currentOpBtn?.max ?? 100;
    sliderRef.current.style.setProperty('--pct', `${(opSettings.param / max) * 100}%`);
  }, [opSettings?.param, currentOpBtn?.max]);

  /* ── Shared sub-components ── */
  const SwatchCol = (
    <div className="bg-white flex flex-col items-center w-[168px] shrink-0 p-6 gap-3">
      <button
        type="button"
        onClick={e => { setPickerPos({ x: e.clientX, y: e.clientY }); setShowPicker(true); }}
        className="hover:opacity-90 transition-opacity"
        title="클릭하여 색상 선택"
      >
        <ColorShape color={displayHex} size={120} />
      </button>
      <div className="flex flex-col items-center gap-0.5 w-full">
        {useOklch ? (() => {
          const ok = hexToOKLCH(displayHex);
          return (
            <>
              <span className="text-[10px] font-medium text-[#aaa] uppercase tracking-wider">OKLCH</span>
              <span className="text-[11px] font-semibold font-mono text-[#333] text-center">
                {Math.round(ok.l * 1000) / 10}% {Math.round(ok.c * 1000) / 1000} {Math.round(ok.h)}°
              </span>
            </>
          );
        })() : (
          <>
            <span className="text-[10px] font-medium text-[#aaa] uppercase tracking-wider">HEX</span>
            <span className="text-[11px] font-semibold font-mono text-[#333]">{displayHex.toUpperCase()}</span>
          </>
        )}
      </div>
    </div>
  );

  const Header = (
    <div className="flex items-center justify-between h-[80px] px-6 shrink-0 border-b border-[#f0f0f0]">
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-[16px] text-[#333]">Key color</p>
        <p className="text-[12px] font-medium text-[#999]">{groupLabels[colorKey] ?? colorKey}</p>
      </div>
      <button
        type="button"
        aria-label="닫기"
        onClick={handleCancel}
        className="w-7 h-7 flex items-center justify-center text-[#808088] hover:text-[#333] transition-colors rounded-full hover:bg-[#f5f5f5]"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const Footer = (
    <div className="flex items-center justify-between h-[80px] px-[30px] shrink-0 border-t border-[#f0f0f0]">
      <div className="flex gap-[10px]">
        {!isCore && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="h-9 px-[10px] bg-[#fff0f0] rounded-[10px] text-[15px] font-semibold text-[#e44] hover:bg-[#ffe0e0] transition-colors"
          >
            그룹 삭제
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="h-9 px-[10px] bg-[#f5f5f5] rounded-[10px] text-[15px] font-semibold text-[#808088] hover:bg-[#eee] transition-colors"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSetAsDefault}
          className="h-9 px-[10px] bg-[#eef5ff] rounded-[10px] text-[15px] font-semibold text-[#7490e7] hover:bg-[#ddeaff] transition-colors"
        >
          Set Default
        </button>
      </div>
      <div className="flex gap-[10px]">
        <button
          type="button"
          onClick={handleCancel}
          className="w-[100px] h-9 bg-[#f5f5f5] rounded-[10px] text-[15px] font-semibold text-[#808088] hover:bg-[#eee] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="w-[100px] h-9 bg-[#666666] rounded-[10px] text-[15px] font-semibold text-white hover:bg-[#555] transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );

  // Manual mode
  if (globalGenerationMode === 'manual') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div
          ref={popupRef}
          className="bg-white rounded-[20px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.12)] w-[640px] flex flex-col overflow-hidden relative"
        >
          {Header}

          <div className="flex flex-1 gap-px bg-[#f0f0f0] min-h-0">
            {SwatchCol}

            {/* Right: Title + Description */}
            <div className="bg-white flex flex-col gap-[30px] flex-1 p-6 min-h-0">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-[12px] text-[#666]">Title</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  className="h-9 border border-[#dddddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
                  placeholder="Primary"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <label className="font-semibold text-[12px] text-[#666]">Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="flex-1 border border-[#dddddd] rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none min-h-0"
                />
              </div>
            </div>
          </div>

          {Footer}

          {showPicker && (
            <div className="fixed inset-0 z-[60]">
              <ColorPicker
                color={isValidHex(hex) ? normalizeHex(hex) : initialHex}
                anchorPos={pickerPos ?? undefined}
                onChange={handlePickerChange}
                onClose={handlePickerClose}
              />
            </div>
          )}

          {showToast && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70]">
              <div className="bg-[#333] text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                현재 설정이 초기값으로 저장되었습니다.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Auto mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={popupRef}
        className="bg-white rounded-[20px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.12)] w-[900px] flex flex-col overflow-hidden relative"
      >
        {Header}

        {/* Body — 3 columns */}
        <div className="flex flex-1 gap-px bg-[#f0f0f0] min-h-0 overflow-hidden">
          {SwatchCol}

          {/* Col 2: Name + Description */}
          <div className="bg-white flex flex-col gap-[30px] w-[280px] shrink-0 p-6 min-h-0">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Name</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                className="h-9 border border-[#dddddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
                placeholder="Secondary"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <label className="font-semibold text-[12px] text-[#666]">Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="secondary 기본색"
                className="flex-1 border border-[#dddddd] rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none min-h-0 placeholder-[#ccc]"
              />
            </div>
          </div>

          {/* Col 3: Generation Settings */}
          <div className="bg-white flex-1 flex flex-col gap-5 p-6 overflow-y-auto min-w-0">
            {isOperationBased && opSettings && (
              <>
                {/* Source color */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Source color</label>
                  <select
                    aria-label="Source color"
                    value={opSettings.sourceKey}
                    onChange={e => handleSourceChange(e.target.value)}
                    className="h-9 px-3 border border-[#dddddd] rounded-[10px] text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] bg-white appearance-none cursor-pointer"
                  >
                    {groupOrder.map(k => (
                      <option key={k} value={k}>{groupLabels[k] ?? k}</option>
                    ))}
                  </select>
                </div>

                {/* Operation buttons */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Operation</label>
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map(group => (
                      <div key={group} className="flex gap-2">
                        {OPERATION_BUTTONS.filter(b => b.group === group).map(btn => (
                          <button
                            key={btn.value}
                            type="button"
                            onClick={() => handleOperationChange(btn.value)}
                            className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                              opSettings.operation === btn.value
                                ? 'bg-[#999999] text-white'
                                : 'bg-white text-[#333] border border-[#ddd] hover:bg-[#f5f5f5]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Param slider */}
                {currentOpBtn?.hasParam && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[12px] text-[#666]">{currentOpBtn.label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={currentOpBtn.max}
                          value={opSettings.param}
                          onChange={e => handleParamChange(Number(e.target.value))}
                          className="w-12 text-[12px] font-medium text-[#808088] text-right border border-[#e8e8e8] rounded-[6px] px-1.5 py-0.5 outline-none"
                        />
                        <span className="text-[12px] text-[#aaa]">
                          {opSettings.operation === 'colorShift' ? '°' : '%'}
                        </span>
                      </div>
                    </div>
                    <input
                      ref={sliderRef}
                      type="range"
                      min={0}
                      max={currentOpBtn.max}
                      value={opSettings.param}
                      onChange={e => handleParamChange(Number(e.target.value))}
                      className="param-slider w-full cursor-pointer appearance-none h-[4px] rounded-full"
                    />
                  </div>
                )}

                {/* Formula preview */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Formula</label>
                  <div className="h-9 bg-[#f5f5f5] border border-[#dddddd] rounded-[10px] px-3 flex items-center">
                    <span className="text-[12px] font-medium text-[#999] font-mono">
                      {buildFormulaString(label, opSettings, sourceLabel)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {(isPrimary || isNeutral) && rangeSettings && (
              <div className="flex flex-col gap-3">
                <label className="font-semibold text-[12px] text-[#666]">Range</label>
                <RangeRow label="H" floor={0} ceil={360} value={rangeSettings.rule.h} onChange={v => handleRangeChange('h', v)} />
                <RangeRow label="S" floor={0} ceil={100} value={rangeSettings.rule.s} onChange={v => handleRangeChange('s', v)} />
                <RangeRow label="L" floor={0} ceil={100} value={rangeSettings.rule.l} onChange={v => handleRangeChange('l', v)} />
              </div>
            )}
          </div>
        </div>

        {Footer}

        {showPicker && (
          <div className="fixed inset-0 z-[60]">
            <ColorPicker
              color={isValidHex(hex) ? normalizeHex(hex) : initialHex}
              anchorPos={pickerPos ?? undefined}
              onChange={handlePickerChange}
              onClose={handlePickerClose}
            />
          </div>
        )}

        {showToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70]">
            <div className="bg-[#333] text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
              현재 설정이 초기값으로 저장되었습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
