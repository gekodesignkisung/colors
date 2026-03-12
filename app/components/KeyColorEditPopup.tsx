'use client';

import { useEffect, useRef, useState } from 'react';
import { hexToHSL, hexToOKLCH, isValidHex, normalizeHex } from '@/lib/colorUtils';
import { applyRule } from '@/lib/generateTokens';
import { ColorShape } from '@/app/components/ColorShape';
import ColorPicker from '@/app/components/ColorPicker';
import { RangeRow } from '@/app/components/RangeRow';
import { useColorStore, DEFAULT_GENERATE_RULE } from '@/store/colorStore';
import { buildFormulaString } from '@/lib/generateTokens';
import { KeyColorGenSettings, KeyColorAutoSettings, OpGenSettings, RangeGenSettings } from '@/types/tokens';

// stage definitions for formula UI (mirrors TokenEditPopup)

interface Stage1Meta { value: 'source' | 'grayscale' | 'invert'; label: string; }
const STAGE1_OPS: Stage1Meta[] = [
  { value: 'source',    label: 'Source'    },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'invert',    label: 'Invert'    },
];

interface Stage2Meta {
  value: string; // TokenOperation
  label: string;
  hasParam: boolean;
  paramLabel: string;
  defaultParam: number;
}
const STAGE2_OPS: Stage2Meta[] = [
  { value: 'source',        label: 'None',         hasParam: false, paramLabel: '',            defaultParam: 0  },
  { value: 'setLightness',  label: 'Lightness',    hasParam: true,  paramLabel: 'L %',         defaultParam: 50 },
  { value: 'setSaturation', label: 'Saturation',   hasParam: true,  paramLabel: 'S %',         defaultParam: 50 },
  { value: 'colorShift',    label: 'Color Shift',  hasParam: true,  paramLabel: 'Hue shift °', defaultParam: 30 },
  { value: 'lighten',       label: 'Lighten (+)',  hasParam: true,  paramLabel: 'Amount %',    defaultParam: 15 },
  { value: 'darken',        label: 'Darken (−)',   hasParam: true,  paramLabel: 'Amount %',    defaultParam: 15 },
];

interface KeyColorEditPopupProps {
  anchorPos?: { x: number; y: number };
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



export default function KeyColorEditPopup({
  anchorPos,
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

  // formula editor state (stage1/stage2/style)
  const [stage1, setStage1] = useState<'source' | 'grayscale' | 'invert'>('source');
  const [stage2Op, setStage2Op] = useState<string>('source');
  const [stage2Param, setStage2Param] = useState<number>(0);
  const [sourceKey, setSourceKey] = useState<string>('primary');

  const popupRef  = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const { keyGenSettings, setKeyGenSettings, recomputeDerivedColor, groupLabels, groupOrder, setDefaultKeyGenSettings, useOklch, baseColors } = useColorStore();
  const settings = keyGenSettings[colorKey];
  const currentSettings = localGenSettings || settings;

  useEffect(() => {
    setHex(initialHex);
    setLabel(initialLabel);
    setDesc(initialDescription);
    setLocalGenSettings(null);

    // initialize auto settings fields from store (if available)
    if (settings && settings.mode === 'auto' && settings.autoSettings.kind === 'operation') {
      const op = settings.autoSettings as OpGenSettings;
      setSourceKey(op.sourceKey);
      setStage1(op.stage1 ?? 'source');
      setStage2Op(op.operation);
      setStage2Param(op.param);
    }
  }, [colorKey, initialHex, initialLabel, initialDescription, settings]);

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
    // first handle any range/manual overrides stored in localGenSettings
    if (localGenSettings) {
      setKeyGenSettings(colorKey, localGenSettings);
      if (isOperationBased) {
        recomputeDerivedColor(colorKey);
      }
    }
    // build and save auto settings if this key uses operation mode and not already handled above
    if (isOperationBased && currentSettings && currentSettings.mode === 'auto') {
      const newSettings: KeyColorGenSettings = {
        mode: 'auto',
        autoSettings: {
          kind: 'operation',
          sourceKey,
          stage1,
          operation: stage2Op as any,
          param: stage2Param,
        } as OpGenSettings,
      };
      setKeyGenSettings(colorKey, newSettings);
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
      secondary: { mode: 'auto',   autoSettings: { kind: 'operation', sourceKey: 'primary', stage1: 'source', operation: 'colorShift', param: 60 } },
      tertiary:  { mode: 'auto',   autoSettings: { kind: 'operation', sourceKey: 'primary', stage1: 'source', operation: 'colorShift', param: 120 } },
      neutral:   { mode: 'auto',   autoSettings: { kind: 'range', rule: { h:{min:0,max:360}, s:{min:0,max:15}, l:{min:20,max:75} } } },
    };
    const def = defaults[colorKey] || defaults.primary;
    setKeyGenSettings(colorKey, def);
    // if we are in operation-based editing, also sync UI state
    if (isOperationBased && def.mode === 'auto' && def.autoSettings.kind === 'operation') {
      const op = def.autoSettings as OpGenSettings;
      setSourceKey(op.sourceKey);
      setStage1(op.stage1 ?? 'source');
      setStage2Op(op.operation);
      setStage2Param(op.param);
    }
  };

  const handleSetAsDefault = () => {
    if (currentSettings) {
      // first commit any pending edits
      if (isOperationBased && currentSettings.mode === 'auto') {
        const newSettings: KeyColorGenSettings = {
          mode: 'auto',
          autoSettings: {
            kind: 'operation',
            sourceKey,
            stage1,
            operation: stage2Op as any,
            param: stage2Param,
          } as OpGenSettings,
        };
        setKeyGenSettings(colorKey, newSettings);
        recomputeDerivedColor(colorKey);
        setDefaultKeyGenSettings(colorKey, newSettings);
      } else if (localGenSettings) {
        // range or manual overrides
        setKeyGenSettings(colorKey, localGenSettings);
        setDefaultKeyGenSettings(colorKey, localGenSettings);
      } else {
        setDefaultKeyGenSettings(colorKey, currentSettings);
      }
      setShowToast(true);
    }
  };

  const handleSourceChange = (key: string) => {
    setSourceKey(key);
  };

  const handleStage1Change = (val: 'source' | 'grayscale' | 'invert') => {
    setStage1(val);
  };

  const handleStage2Change = (op: string) => {
    setStage2Op(op);
    const meta = STAGE2_OPS.find(o => o.value === op);
    if (meta?.hasParam) setStage2Param(meta.defaultParam);
    else setStage2Param(0);
  };

  const handleStage2ParamChange = (param: number) => {
    setStage2Param(param);
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

  const rangeSettings = currentSettings?.autoSettings.kind === 'range' ? (currentSettings.autoSettings as RangeGenSettings) : null;
  const sourceLabel = groupLabels[sourceKey] ?? sourceKey;

  // compute preview color for the swatch
  const previewColor = (() => {
    if (localGenSettings) {
      // if user edited a range or manual override, show that
      if (localGenSettings.mode === 'manual') return isValidHex(hex) ? normalizeHex(hex) : initialHex;
      if (localGenSettings.autoSettings.kind === 'range') return displayHex;
      // operation mode inside localGenSettings
      const op = localGenSettings.autoSettings as OpGenSettings;
      const rule: any = { stage1: op.stage1 ?? 'source', operation: op.operation, source: op.sourceKey, param: op.param, description: '' };
      return applyRule(rule, baseColors, false, useOklch);
    }
    if (isOperationBased && currentSettings && currentSettings.mode === 'auto' && currentSettings.autoSettings.kind === 'operation') {
      const rule: any = { stage1, operation: stage2Op, source: sourceKey, param: stage2Param, description: '' };
      return applyRule(rule, baseColors, false, useOklch);
    }
    // otherwise manual value or non-operation
    if (currentSettings?.mode === 'manual') return isValidHex(hex) ? normalizeHex(hex) : initialHex;
    return displayHex;
  })();

  // Sync slider fill CSS variable for our stage2 parameter
  useEffect(() => {
    if (!sliderRef.current) return;
    const max = stage2Op === 'colorShift' ? 360 : 100;
    sliderRef.current.style.setProperty('--pct', `${(stage2Param / max) * 100}%`);
  }, [stage2Param, stage2Op]);

  /* ── Shared sub-components ── */
  const SwatchCol = (
    <div className="bg-white flex flex-col items-center w-[168px] shrink-0 p-6 gap-3">
      <button
        type="button"
        onClick={e => { setPickerPos({ x: e.clientX, y: e.clientY }); setShowPicker(true); }}
        className="hover:opacity-90 transition-opacity"
        title="클릭하여 색상 선택"
      >
        <ColorShape color={previewColor} size={120} />
      </button>
      <div className="flex flex-col items-center gap-0.5 w-full">
        {useOklch ? (() => {
          const ok = hexToOKLCH(previewColor);
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
            <span className="text-[11px] font-semibold font-mono text-[#333]">{previewColor.toUpperCase()}</span>
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
  const getPositionStyle = () => {
    // always center the popup on screen
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 60,
    } as React.CSSProperties;
  };

  if (globalGenerationMode === 'manual') {
    return (
      <div className="fixed inset-0 z-50 bg-black/30">
        <div
          ref={popupRef}
          style={getPositionStyle()}
          className="absolute bg-white rounded-[20px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.12)] w-[640px] flex flex-col overflow-hidden relative"
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
    <div className="fixed inset-0 z-50 bg-black/30">
      <div
        ref={popupRef}
        style={getPositionStyle()}
        className="absolute bg-white rounded-[20px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.12)] w-[900px] flex flex-col overflow-hidden relative"
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
            {isOperationBased && (
              <>
                {/* Source color selector */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Source color</label>
                  <select
                    aria-label="Source color"
                    value={sourceKey}
                    onChange={e => handleSourceChange(e.target.value)}
                    className="h-9 px-3 border border-[#dddddd] rounded-[10px] text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] bg-white appearance-none cursor-pointer"
                  >
                    {groupOrder.map(k => (
                      <option key={k} value={k}>{groupLabels[k] ?? k}</option>
                    ))}
                  </select>
                </div>

                {/* Stage 1 */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Stage 1</label>
                  <div className="flex gap-2">
                    {STAGE1_OPS.map(op => (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => handleStage1Change(op.value)}
                        className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                          stage1 === op.value
                            ? 'bg-[#999999] text-white'
                            : 'bg-white border border-[#ddd] text-[#333] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Stage 2</label>
                  <div className="flex flex-col gap-2">
                    {STAGE2_OPS.reduce<Stage2Meta[][]>((rows, op, i) => {
                      if (i % 3 === 0) rows.push([op]);
                      else rows[rows.length - 1].push(op);
                      return rows;
                    }, []).map((row, ri) => (
                      <div key={ri} className="flex gap-2">
                        {row.map(op => (
                          <button
                            key={op.value}
                            type="button"
                            onClick={() => handleStage2Change(op.value)}
                            className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                              stage2Op === op.value
                                ? 'bg-[#999999] text-white'
                                : 'bg-white border border-[#ddd] text-[#333] hover:bg-[#f5f5f5]'
                            }`}
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Param slider */}
                {(() => {
                  const currentStage2 = STAGE2_OPS.find(o => o.value === stage2Op);
                  const max = stage2Op === 'colorShift' ? 360 : 100;
                  return (
                    <div className={`flex flex-col gap-2 ${currentStage2?.hasParam ? '' : 'invisible'}`}>
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[12px] text-[#666]">
                          {currentStage2?.paramLabel || 'Param'}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={max}
                            value={stage2Param}
                            onChange={e => handleStage2ParamChange(Number(e.target.value))}
                            className="w-12 text-[12px] font-medium text-[#808088] text-right border border-[#e8e8e8] rounded-[6px] px-1.5 py-0.5 outline-none"
                          />
                          <span className="text-[12px] text-[#aaa]">
                            {stage2Op === 'colorShift' ? '°' : '%'}
                          </span>
                        </div>
                      </div>
                      <input
                        ref={sliderRef}
                        type="range"
                        min={0}
                        max={max}
                        value={stage2Param}
                        onChange={e => handleStage2ParamChange(Number(e.target.value))}
                        className="param-slider w-full cursor-pointer appearance-none h-[4px] rounded-full"
                      />
                    </div>
                  );
                })()}

                {/* Formula preview */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Formula</label>
                  <div className="h-9 bg-[#f5f5f5] border border-[#dddddd] rounded-[10px] px-3 flex items-center">
                    <span className="text-[12px] font-medium text-[#999] font-mono">
                      {buildFormulaString(label, { kind: 'operation', sourceKey, stage1, operation: stage2Op as any, param: stage2Param }, sourceLabel)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {(isPrimary || isNeutral) && rangeSettings && (
              <div className="flex flex-col gap-3">
                <label className="font-semibold text-[12px] text-[#666]">Range</label>
                {/* when OKLCH mode is active we reinterpret the channels: use rule.l (L),
                    rule.s becomes chroma (C) percentage, and rule.h stays hue.  We also
                    reorder the rows to L‑C‑H for a logical LCH presentation. */}
                {(
                  useOklch ? ['l', 's', 'h'] : ['h', 's', 'l']
                ).map(channel => {
                  const labelMap: Record<string, string> = useOklch
                    ? { l: 'L', s: 'C', h: 'H' }
                    : { h: 'H', s: 'S', l: 'L' };
                  const floorMap: Record<string, number> = { h: 0, s: 0, l: 0 };
                  const ceilMap: Record<string, number> = { h: 360, s: 100, l: 100 };
                  const value = (rangeSettings.rule as any)[channel];
                  return (
                    <RangeRow
                      key={channel}
                      label={labelMap[channel]}
                      floor={floorMap[channel]}
                      ceil={ceilMap[channel]}
                      value={value}
                      onChange={v => handleRangeChange(channel as 'h' | 's' | 'l', v)}
                    />
                  );
                })}
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
