'use client';

import { useEffect, useRef, useState } from 'react';
import { hexToHSL } from '@/lib/colorUtils';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';
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
  { label: 'Source', value: 'source', group: 0, hasParam: false },
  { label: 'Grayscale', value: 'grayscale', group: 0, hasParam: false },
  { label: 'Invert', value: 'invert', group: 0, hasParam: false },
  { label: 'Contrast', value: 'contrast', group: 1, hasParam: false },
  { label: 'Lightness', value: 'setLightness', group: 1, hasParam: true, max: 100 },
  { label: 'Saturation', value: 'setSaturation', group: 1, hasParam: true, max: 100 },
  { label: 'Color Shift', value: 'colorShift', group: 2, hasParam: true, max: 360 },
  { label: 'Lighten (+)', value: 'lighten', group: 2, hasParam: true, max: 100 },
  { label: 'Darken (−)', value: 'darken', group: 2, hasParam: true, max: 100 },
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

  const popupRef    = useRef<HTMLDivElement>(null);
  const hexInputRef = useRef<HTMLInputElement>(null);

  // Store context
  const { keyGenSettings, setKeyGenSettings, recomputeDerivedColor, groupLabels, groupOrder, setDefaultKeyGenSettings } = useColorStore();
  const settings = keyGenSettings[colorKey];
  const currentSettings = localGenSettings || settings;

  // sync if parent changes (e.g. switching cards)
  useEffect(() => {
    setHex(initialHex);
    setLabel(initialLabel);
    setDesc(initialDescription);
    setLocalGenSettings(null); // Reset local gen settings when switching cards
  }, [colorKey, initialHex, initialLabel, initialDescription]);


  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-hide toast after 2.5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handlePickerChange = (newHex: string) => {
    setHex(newHex);
    if (hexInputRef.current) hexInputRef.current.value = newHex.toUpperCase();
  };

  const handlePickerClose = (savedHex?: string) => {
    if (savedHex) {
      setHex(savedHex);
      if (hexInputRef.current) hexInputRef.current.value = savedHex.toUpperCase();
    }
    setShowPicker(false);
  };

  const handleHexTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHex(v);
  };

  const handleSave = () => {
    const finalHex = isValidHex(hex) ? normalizeHex(hex) : initialHex;
    const finalLabel = label.trim() || initialLabel;
    // Save generation settings to store if changed
    if (localGenSettings) {
      setKeyGenSettings(colorKey, localGenSettings);
      recomputeDerivedColor(colorKey);
    }
    onSave(finalHex, finalLabel, desc);
    onClose();
  };

  const handleCancel = () => {
    setLocalGenSettings(null); // Reset local changes
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    handleCancel();
  };

  const displayHex = isValidHex(hex) ? normalizeHex(hex) : hex;
  const { l } = hexToHSL(displayHex);
  const badgeFg = l > 55 ? '#1a1a1a' : '#ffffff';

  // Generation settings handlers
  const handleModeChange = (newMode: 'auto' | 'manual') => {
    const current = currentSettings;
    if (!current) return;
    const newSettings: KeyColorGenSettings = {
      mode: newMode,
      autoSettings: current.autoSettings,
    };
    setLocalGenSettings(newSettings);
  };

  const handleReset = () => {
    const defaults: Record<string, KeyColorGenSettings> = {
      primary:   { mode: 'manual',  autoSettings: { kind: 'range', rule: { ...DEFAULT_GENERATE_RULE } } },
      secondary: { mode: 'auto',    autoSettings: { kind: 'operation', sourceKey: 'primary', operation: 'colorShift', param: 60 } },
      tertiary:  { mode: 'auto',    autoSettings: { kind: 'operation', sourceKey: 'primary', operation: 'colorShift', param: 120 } },
      neutral:   { mode: 'auto',    autoSettings: { kind: 'range', rule: { h:{min:0,max:360}, s:{min:0,max:15}, l:{min:20,max:75} } } },
    };
    const defaultSettings = defaults[colorKey] || defaults.primary;
    setKeyGenSettings(colorKey, defaultSettings);
  };

  const handleSetAsDefault = () => {
    console.log('handleSetAsDefault called', { currentSettings, colorKey });
    if (currentSettings) {
      setDefaultKeyGenSettings(colorKey, currentSettings);
      setShowToast(true);
      console.log('Toast should show now');
    } else {
      console.log('currentSettings is null/undefined');
    }
  };

  const handleSourceChange = (sourceKey: string) => {
    const current = currentSettings;
    if (!current || current.autoSettings.kind !== 'operation') return;
    const opSettings = current.autoSettings as OpGenSettings;
    const newSettings: KeyColorGenSettings = {
      mode: 'auto',
      autoSettings: { ...opSettings, sourceKey } as KeyColorAutoSettings,
    };
    setLocalGenSettings(newSettings);
  };

  const handleOperationChange = (operation: string) => {
    const current = currentSettings;
    if (!current || current.autoSettings.kind !== 'operation') return;
    const opSettings = current.autoSettings as OpGenSettings;
    const btn = OPERATION_BUTTONS.find(b => b.value === operation);
    const defaultParam = btn?.max ?? 50;
    const newSettings: KeyColorGenSettings = {
      mode: 'auto',
      autoSettings: { ...opSettings, operation: operation as any, param: opSettings.param || defaultParam } as KeyColorAutoSettings,
    };
    setLocalGenSettings(newSettings);
  };

  const handleParamChange = (param: number) => {
    const current = currentSettings;
    if (!current || current.autoSettings.kind !== 'operation') return;
    const opSettings = current.autoSettings as OpGenSettings;
    const newSettings: KeyColorGenSettings = {
      mode: 'auto',
      autoSettings: { ...opSettings, param } as KeyColorAutoSettings,
    };
    setLocalGenSettings(newSettings);
  };

  const handleRangeChange = (channel: 'h' | 's' | 'l', value: { min: number; max: number }) => {
    const current = currentSettings;
    if (!current || current.autoSettings.kind !== 'range') return;
    const rangeSettings = current.autoSettings as RangeGenSettings;
    const newRule = { ...rangeSettings.rule, [channel]: value };
    const newSettings: KeyColorGenSettings = {
      mode: 'auto',
      autoSettings: { kind: 'range', rule: newRule } as KeyColorAutoSettings,
    };
    setLocalGenSettings(newSettings);
  };

  // Determine panel type
  const isPrimary = colorKey === 'primary';
  const isNeutral = colorKey === 'neutral';
  const isOperationBased = !isPrimary && !isNeutral;

  const opSettings = currentSettings?.autoSettings.kind === 'operation' ? (currentSettings.autoSettings as OpGenSettings) : null;
  const rangeSettings = currentSettings?.autoSettings.kind === 'range' ? (currentSettings.autoSettings as RangeGenSettings) : null;
  const sourceLabel = opSettings ? groupLabels[opSettings.sourceKey] ?? opSettings.sourceKey : '';
  const currentOpBtn = opSettings ? OPERATION_BUTTONS.find(b => b.value === opSettings.operation) : null;

  // Manual mode layout
  if (globalGenerationMode === 'manual') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div
          ref={popupRef}
          className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[640px] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex h-[80px] items-center justify-between px-6 shrink-0">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-[16px] text-[#333]">Key color</p>
              <p className="text-[12px] font-medium text-[#999]">{groupLabels[colorKey] ?? colorKey}</p>
            </div>
            <button
              onClick={handleCancel}
              className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body — 2 column layout */}
          <div className="flex flex-1 bg-white overflow-hidden">
            {/* Left column: Color swatch */}
            <div className="flex flex-col items-center justify-center px-6 py-6 shrink-0 w-[180px] border-r border-[#eee]">
              <button
                type="button"
                onClick={e => { setPickerPos({ x: e.clientX, y: e.clientY }); setShowPicker(true); }}
                className="relative flex items-end justify-center rounded-full shrink-0 size-[120px] hover:opacity-90 transition-opacity"
                style={{ backgroundColor: displayHex }}
              >
                <span className="font-medium text-[12px] text-white pb-3 font-mono">{displayHex.toUpperCase()}</span>
              </button>
            </div>

            {/* Right column: Input fields */}
            <div className="flex flex-col gap-6 flex-1 px-6 py-6 overflow-y-auto">
              {/* Title input */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-[12px] text-[#666]">Title</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
                  placeholder="Primary"
                />
              </div>

              {/* Description input */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="font-semibold text-[12px] text-[#666]">Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="flex-1 border border-[#ddd] rounded-[10px] px-3 py-2 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex h-[80px] items-center justify-end gap-3 px-[30px] shrink-0 border-t border-[#eee]">
            <button
              onClick={handleCancel}
              className="h-9 w-[100px] bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-9 w-[100px] bg-[#666] rounded-[10px] text-[15px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>

          {/* Color Picker 모달 */}
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
        </div>
      </div>
    );
  }

  // Auto mode layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={popupRef}
        className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[900px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex h-[80px] items-center justify-between px-6 shrink-0">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-[16px] text-[#333]">Key color</p>
            <p className="text-[12px] font-medium text-[#999]">{groupLabels[colorKey] ?? colorKey}</p>
          </div>
          <button
            onClick={handleCancel}
            className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — 3 column layout */}
        <div className="flex flex-1 bg-[#eee] gap-px overflow-hidden min-h-0">
          {/* Left Column: Color Swatch */}
          <div className="bg-white flex items-start justify-center px-6 py-6 shrink-0 border-r border-[#eee] w-[180px]">
            <button
              type="button"
              onClick={e => { setPickerPos({ x: e.clientX, y: e.clientY }); setShowPicker(true); }}
              className="relative flex items-end justify-center rounded-full shrink-0 size-[120px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: displayHex }}
            >
              <span className="font-medium text-[12px] text-white pb-3 font-mono">{displayHex.toUpperCase()}</span>
            </button>
          </div>

          {/* Middle Column: Name & Description */}
          <div className="bg-white flex-1 px-6 py-4 flex flex-col gap-6 min-w-0 min-h-0 border-r border-[#eee]">
            {/* Name input */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Name</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
                placeholder="Secondary"
              />
            </div>

            {/* Description textarea */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-semibold text-[12px] text-[#666]">Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="secondary 기본색"
                className="flex-1 border border-[#ddd] rounded-[10px] px-3 py-2 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none placeholder-[#ccc]"
              />
            </div>
          </div>

          {/* Right Column: Generation Settings */}
          <div className="bg-white flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto min-w-0">
            {isOperationBased && opSettings && (
              <>
                {/* Source color */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Source color</label>
                  <select
                    value={opSettings.sourceKey}
                    onChange={e => handleSourceChange(e.target.value)}
                    className="h-9 px-3 border border-[#ddd] rounded-[10px] text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] bg-white accent-[#999]"
                  >
                    {groupOrder.map(k => (
                      <option key={k} value={k}>
                        {groupLabels[k] ?? k}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operation buttons */}
                <div>
                  <label className="font-semibold text-[12px] text-[#666] block mb-2">Operation</label>
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map(group => (
                      <div key={group} className="flex gap-2">
                        {OPERATION_BUTTONS.filter(b => b.group === group).map(btn => (
                          <button
                            key={btn.value}
                            type="button"
                            onClick={() => handleOperationChange(btn.value)}
                            className={`flex-1 px-2 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                              opSettings.operation === btn.value
                                ? 'bg-[#999] text-white'
                                : 'bg-white text-[#333] border border-[#ddd] hover:border-[#999]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Param slider (if operation has param) */}
                {currentOpBtn?.hasParam && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-[12px] text-[#666]">{currentOpBtn.label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={currentOpBtn.max}
                          value={opSettings.param}
                          onChange={e => handleParamChange(Number(e.target.value))}
                          className="w-[50px] h-7 border border-[#ddd] rounded-[6px] px-2 text-[12px] font-medium text-[#333] text-center outline-none focus:border-[#808088]"
                        />
                        <span className="text-[10px] font-medium text-[#ccc] w-[11px]">
                          {opSettings.operation === 'colorShift' ? '°' : '%'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="relative h-[14px]">
                        <div className="absolute bg-[#ddd] h-[4px] left-0 rounded-[50px] top-[5px] w-full" />
                        <input
                          type="range"
                          min={0}
                          max={currentOpBtn.max}
                          value={opSettings.param}
                          onChange={e => handleParamChange(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer accent-[#808088]"
                          style={{
                            WebkitAppearance: 'slider-horizontal',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Formula preview */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Formula</label>
                  <input
                    type="text"
                    value={buildFormulaString(label, opSettings, sourceLabel)}
                    readOnly
                    className="h-9 px-3 border border-[#ddd] rounded-[10px] text-[12px] font-mono text-[#999] bg-[#f5f5f5] outline-none"
                  />
                </div>
              </>
            )}

            {(isPrimary || isNeutral) && rangeSettings && (
              <div className="flex flex-col gap-3">
                <RangeRow
                  label="H"
                  floor={0}
                  ceil={360}
                  value={rangeSettings.rule.h}
                  onChange={v => handleRangeChange('h', v)}
                />
                <RangeRow
                  label="S"
                  floor={0}
                  ceil={100}
                  value={rangeSettings.rule.s}
                  onChange={v => handleRangeChange('s', v)}
                />
                <RangeRow
                  label="L"
                  floor={0}
                  ceil={100}
                  value={rangeSettings.rule.l}
                  onChange={v => handleRangeChange('l', v)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-[80px] items-center justify-between px-[30px] shrink-0 border-t border-[#eee]">
          <div className="flex gap-2.5 items-center">
            {!isCore && onRemove && (
              <button
                onClick={handleRemove}
                className="h-9 px-4 bg-[#fff0f0] rounded-[10px] text-[14px] font-medium text-[#e44] hover:bg-[#ffe0e0] transition-colors"
              >
                그룹 삭제
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSetAsDefault}
              className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Set as default
            </button>
          </div>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={handleCancel}
              className="h-9 w-[100px] bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-9 w-[100px] bg-[#666] rounded-[10px] text-[15px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Color Picker 모달 */}
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

        {/* Toast notification */}
        {showToast && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[70]">
            <div className="bg-[#333] text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
              현재 설정이 초기값으로 저장되었습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
