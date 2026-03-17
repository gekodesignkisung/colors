'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useColorStore, DEFAULT_GENERATE_RULE, DEFAULT_KEY_GEN_SETTINGS } from '@/store/colorStore';
import ColorPicker from '@/app/components/ColorPicker';
import OklchPicker from '@/app/components/OklchPicker';
import { RangeRow, SingleTrack } from '@/app/components/RangeRow';
import { hexToOKLCH } from '@/lib/colorUtils';
import { buildFormulaString } from '@/lib/generateTokens';
import { OpGenSettings, KeyColorGenSettings, KeyColorAutoSettings, Stage1Op, TokenOperation, RangeGenSettings } from '@/types/tokens';

function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)}°`;
}

const CORE_KEYS = new Set(['primary', 'secondary', 'tertiary', 'neutral']);

const STAGE1_OPTIONS: { value: Stage1Op; label: string }[] = [
  { value: 'source', label: 'Source' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'invert', label: 'Invert' },
];

const STAGE2_OPTIONS: { value: TokenOperation; label: string }[][] = [
  [
    { value: 'source', label: 'None' },
    { value: 'setLightness', label: 'Lightness' },
    { value: 'setSaturation', label: 'Saturation' },
  ],
  [
    { value: 'colorShift', label: 'Color Shift' },
    { value: 'lighten', label: 'Lighten (+)' },
    { value: 'darken', label: 'Darken (-)' },
  ],
];

interface DrawerState {
  stage1: Stage1Op;
  operation: TokenOperation;
  param: number;
  sourceKey: string;
  description: string;
  label: string;
}

interface Props {
  introStep?: number;
  onNext?: () => void;
}

export default function Step2BaseColorInput({ introStep, onNext }: Props) {
  const {
    baseColors, groupOrder, groupLabels, groupDescriptions,
    setBaseColor, setGroupLabel, setGroupDescription,
    randomizeColors,
    useOklch, toggleOklch,
    keyGenSettings, setKeyGenSettings,
    globalGenerationMode, setGlobalGenerationMode,
    groupEnabled, setGroupEnabled,
  } = useColorStore();

  const [openKey, setOpenKey] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null);

  // Open drawer for a key
  const openDrawer = (key: string) => {
    if (openKey === key) {
      closeDrawer();
      return;
    }
    const kgs = keyGenSettings[key];
    const op = kgs?.autoSettings.kind === 'operation' ? (kgs.autoSettings as OpGenSettings) : null;
    setDrawerState({
      stage1: op?.stage1 ?? 'source',
      operation: op?.operation ?? 'colorShift',
      param: op?.param ?? 60,
      sourceKey: op?.sourceKey ?? groupOrder.find(k => k !== key) ?? 'primary',
      description: groupDescriptions[key] ?? '',
      label: groupLabels[key] ?? key,
    });
    // resetDrawer also uses same logic
    setOpenKey(key);
  };

  const closeDrawer = () => {
    setOpenKey(null);
    setTimeout(() => setDrawerState(null), 300);
  };

  const saveDrawer = (key: string) => {
    if (!drawerState) return;
    const kgs = keyGenSettings[key];
    const isRangeBased = kgs?.autoSettings.kind === 'range';
    const newAutoSettings: KeyColorAutoSettings = isRangeBased
      ? kgs!.autoSettings
      : {
          kind: 'operation',
          sourceKey: drawerState.sourceKey,
          stage1: drawerState.stage1,
          operation: drawerState.operation,
          param: drawerState.param,
        };
    const newKgs: KeyColorGenSettings = {
      mode: globalGenerationMode === 'auto' ? 'auto' : (kgs?.mode ?? 'manual'),
      autoSettings: newAutoSettings,
    };
    setKeyGenSettings(key, newKgs);
    setGroupDescription(key, drawerState.description);
    setGroupLabel(key, drawerState.label.trim() || (groupLabels[key] ?? key));
    closeDrawer();
  };

  const resetDrawer = (key: string) => {
    const defaultKgs = DEFAULT_KEY_GEN_SETTINGS[key];
    const op = defaultKgs?.autoSettings.kind === 'operation' ? (defaultKgs.autoSettings as OpGenSettings) : null;
    // reset store
    if (defaultKgs) {
      setKeyGenSettings(key, { ...defaultKgs, mode: globalGenerationMode === 'auto' ? 'auto' : defaultKgs.mode });
    }
    setDrawerState({
      stage1: op?.stage1 ?? 'source',
      operation: op?.operation ?? 'colorShift',
      param: op?.param ?? 60,
      sourceKey: op?.sourceKey ?? groupOrder.find(k => k !== key) ?? 'primary',
      description: groupDescriptions[key] ?? '',
      label: groupLabels[key] ?? key,
    });
  };

  const getFormulaString = (key: string, ds: DrawerState) => {
    const label = groupLabels[key] ?? key;
    const sourceLabel = groupLabels[ds.sourceKey] ?? ds.sourceKey;
    const opSettings: OpGenSettings = {
      kind: 'operation',
      sourceKey: ds.sourceKey,
      stage1: ds.stage1,
      operation: ds.operation,
      param: ds.param,
    };
    return buildFormulaString(label, opSettings, sourceLabel);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Direct color picker */}
      {pickerKey && (
        <div className="fixed inset-0 z-50 bg-black/30">
          {useOklch ? (
            <OklchPicker
              color={baseColors[pickerKey] ?? '#000000'}
              anchorPos={pickerPos ?? undefined}
              onChange={hex => setBaseColor(pickerKey, hex)}
              onClose={savedHex => {
                if (savedHex) setBaseColor(pickerKey, savedHex);
                setPickerKey(null);
              }}
            />
          ) : (
            <ColorPicker
              color={baseColors[pickerKey] ?? '#000000'}
              anchorPos={pickerPos ?? undefined}
              onChange={hex => setBaseColor(pickerKey, hex)}
              onClose={savedHex => {
                if (savedHex) setBaseColor(pickerKey, savedHex);
                setPickerKey(null);
              }}
            />
          )}
        </div>
      )}

      {/* Top menu bar */}
      <div className="flex items-center justify-between pl-5 pr-5 py-5 border-b border-[#dddddf] shrink-0">
        {/* Generate button */}
        <button
          type="button"
          onClick={randomizeColors}
          className={`w-[200px] h-[60px] bg-white border border-[#999] rounded-[50px] shadow-[0px_3px_10px_rgba(0,0,0,0.1)] flex items-center justify-center gap-[10px] shrink-0 transition-opacity duration-300 ${globalGenerationMode === 'auto' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img src="/icon-generate.svg" alt="" width={30} height={30} />
          <span className="font-semibold text-[16px] text-[#333]">Generate</span>
        </button>

        {/* Auto Generation + OKLCH */}
        <div className="flex items-center gap-5 h-[60px] pl-[32px]">
          <button
            type="button"
            onClick={() => setGlobalGenerationMode(globalGenerationMode === 'auto' ? 'manual' : 'auto')}
            className="flex flex-1 items-center gap-5 px-[20px] h-full rounded-[10px] hover:bg-[#f5f5f5] transition-colors border-0 bg-transparent"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-[14px] font-semibold text-[#333] whitespace-nowrap">Auto Generation</span>
              <span className="text-[11px] text-[#999] whitespace-nowrap">Generate all key colors automatically</span>
            </div>
            <div className="relative w-5 h-8 shrink-0 hover:scale-[1.2] transition-transform duration-200">
              <img src="/icon-switch2-on.svg" alt="" width={20} height={32} className={`block w-5 h-8 transition-opacity duration-300 ${globalGenerationMode === 'auto' ? 'opacity-100' : 'opacity-0'}`} />
              <img src="/icon-switch2-off.svg" alt="" width={20} height={32} className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${globalGenerationMode === 'auto' ? 'opacity-0' : 'opacity-100'}`} />
            </div>
          </button>
          <button
            type="button"
            onClick={toggleOklch}
            className="flex flex-1 items-center gap-5 px-[20px] h-full rounded-[10px] hover:bg-[#f5f5f5] transition-colors border-0 bg-transparent"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-[14px] font-semibold text-[#333] whitespace-nowrap">OKLCH Color Space</span>
              <span className="text-[11px] text-[#999] whitespace-nowrap">Perceptually uniform color space</span>
            </div>
            <div className="relative w-5 h-8 shrink-0 hover:scale-[1.2] transition-transform duration-200">
              <img src="/icon-switch2-on.svg" alt="" width={20} height={32} className={`block w-5 h-8 transition-opacity duration-300 ${useOklch ? 'opacity-100' : 'opacity-0'}`} />
              <img src="/icon-switch2-off.svg" alt="" width={20} height={32} className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${useOklch ? 'opacity-0' : 'opacity-100'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Color card list */}
      <div className="flex-1 overflow-y-auto">
        {groupOrder.map((key) => {
          const label = groupLabels[key] ?? key;
          const raw = baseColors[key] ?? '#000000';
          const colorValue = useOklch ? toOklchLabel(raw) : raw.toUpperCase();
          const enabled = groupEnabled[key] ?? true;
          const isOpen = openKey === key;
          const kgs = keyGenSettings[key];
          const isAuto = globalGenerationMode === 'auto';
          const isRangeKey = key === 'primary' || key === 'neutral';
          let formulaLabel: string | null = null;
          if (isAuto && !isRangeKey && kgs?.autoSettings.kind === 'operation') {
            const op = kgs.autoSettings as OpGenSettings;
            const srcLabel = groupLabels[op.sourceKey] ?? op.sourceKey ?? 'Primary';
            formulaLabel = buildFormulaString(label, op, srcLabel);
          } else if (isAuto && isRangeKey) {
            formulaLabel = 'Range based';
          }

          return (
            <div key={key} className="border-b border-[#dddddf]">
              {/* Card row */}
              <div className="flex items-center gap-[30px] px-5 h-[100px]">
                {/* Color swatch */}
                <button
                  type="button"
                  className={`shrink-0 hover:scale-[1.05] transition-transform duration-200 ${!enabled ? 'pointer-events-none' : ''}`}
                  onClick={e => { setPickerKey(key); setPickerPos({ x: e.clientX, y: e.clientY }); }}
                  title="Click to pick color"
                >
                  <div
                    className="w-[200px] h-[60px] rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: !enabled ? '#ffffff' : raw,
                      border: (() => {
                        const hex = (!enabled ? '#ffffff' : raw).replace('#', '');
                        const r = parseInt(hex.slice(0,2), 16);
                        const g = parseInt(hex.slice(2,4), 16);
                        const b = parseInt(hex.slice(4,6), 16);
                        return (r >= 249 && g >= 249 && b >= 249) ? '1px solid #ddd' : 'none';
                      })(),
                    }}
                  />
                </button>

                {/* Info area */}
                <button
                  type="button"
                  onClick={() => openDrawer(key)}
                  title="Click to configure"
                  className={`flex flex-col items-start flex-1 min-w-0 text-left py-2 px-5 rounded-[10px] hover:bg-[#f5f5f5] transition-colors border-0 bg-transparent cursor-pointer justify-center ${!enabled ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <span className="text-[20px] font-semibold text-[#333]">{label}</span>
                  <div className={`flex items-center gap-2 transition-opacity duration-300 ${!enabled ? 'opacity-0 h-0 overflow-hidden' : ''}`}>
                    <span key={colorValue} className="text-[15px] font-medium text-[#999] whitespace-nowrap w-[160px] inline-block animate-[fadeIn_0.3s_ease]">{colorValue}</span>
                    {formulaLabel && (
                      <span className="text-[15px] font-medium text-[#333] whitespace-nowrap">· {formulaLabel}</span>
                    )}
                  </div>
                </button>

                {/* Switch (secondary, tertiary only) */}
                {(key === 'secondary' || key === 'tertiary') ? (
                  <button
                    type="button"
                    onClick={() => setGroupEnabled(key, !enabled)}
                    className="flex items-center justify-center border-0 bg-transparent hover:scale-[1.2] transition-transform duration-200 shrink-0"
                    style={{ width: 48, height: 48, margin: -8 }}
                  >
                    <div className="relative w-5 h-8">
                      <img src="/icon-switch2-on.svg" alt="" width={20} height={32} className={`block w-5 h-8 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-0'}`} />
                      <img src="/icon-switch2-off.svg" alt="" width={20} height={32} className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${enabled ? 'opacity-0' : 'opacity-100'}`} />
                    </div>
                  </button>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
              </div>

              {/* Drawer */}
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
              {drawerState && (
                <div className="bg-white pl-[250px]">
                  {(() => {
                    const currentKgs = keyGenSettings[key];
                    const isRangeKey = key === 'primary' || key === 'neutral';
                    const showOperation = globalGenerationMode === 'auto' && !isRangeKey;
                    const showRange = globalGenerationMode === 'auto' && isRangeKey;

                    return (
                      <div className="p-5 flex flex-col gap-5">
                        {globalGenerationMode === 'manual' ? (
                          /* Manual mode: Title + Description */
                          <>
                            <div className="flex flex-col gap-2">
                              <span className="text-[12px] font-semibold text-[#666]">Title</span>
                              <input
                                type="text"
                                value={drawerState.label}
                                onChange={e => setDrawerState({ ...drawerState, label: e.target.value })}
                                className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
                                placeholder={groupLabels[key] ?? key}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-[12px] font-semibold text-[#666]">Description</span>
                              <textarea
                                value={drawerState.description}
                                onChange={e => setDrawerState({ ...drawerState, description: e.target.value })}
                                className="border border-[#ddd] rounded-[10px] p-3 text-[13px] text-[#333] resize-none outline-none focus:border-[#808088] min-h-[80px]"
                              />
                            </div>
                          </>
                        ) : (
                          /* Auto mode: Description top, settings below */
                          <>
                            {/* Source color - operation-based only */}
                            {showOperation && (
                              <div className="flex flex-col gap-2">
                                <span className="text-[12px] font-semibold text-[#666]">Source color</span>
                                <div className="relative">
                                  <select
                                    value={drawerState.sourceKey}
                                    onChange={e => setDrawerState({ ...drawerState, sourceKey: e.target.value })}
                                    className="w-full h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] bg-white appearance-none outline-none focus:border-[#808088]"
                                  >
                                    {groupOrder.filter(k => k !== key).map(k => (
                                      <option key={k} value={k}>{groupLabels[k] ?? k}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                            {/* Description */}
                            <div className="flex flex-col gap-2">
                              <span className="text-[12px] font-semibold text-[#666]">Description</span>
                              <textarea
                                value={drawerState.description}
                                onChange={e => setDrawerState({ ...drawerState, description: e.target.value })}
                                className="border border-[#ddd] rounded-[10px] p-3 text-[13px] text-[#333] resize-none outline-none focus:border-[#808088] min-h-[80px]"
                              />
                            </div>
                            {/* Settings: operation-based */}
                            {showOperation && (
                            /* Auto + operation-based (secondary, tertiary) */
                            <>
                              {/* Stage 1 */}
                              <div className="flex flex-col gap-2">
                                <span className="text-[12px] font-semibold text-[#666]">Stage 1</span>
                                <div className="flex gap-2">
                                  {STAGE1_OPTIONS.map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setDrawerState({ ...drawerState, stage1: opt.value })}
                                      className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors border ${
                                        drawerState.stage1 === opt.value
                                          ? 'bg-[#999] text-white border-[#999]'
                                          : 'bg-white text-[#333] border-[#ddd] hover:bg-[#f5f5f5]'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Stage 2 */}
                              <div className="flex flex-col gap-2">
                                <span className="text-[12px] font-semibold text-[#666]">Stage 2</span>
                                <div className="flex flex-col gap-2">
                                  {STAGE2_OPTIONS.map((row, i) => (
                                    <div key={i} className="flex gap-2">
                                      {row.map(opt => (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => setDrawerState({ ...drawerState, operation: opt.value })}
                                          className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors border ${
                                            drawerState.operation === opt.value
                                              ? 'bg-[#999] text-white border-[#999]'
                                              : 'bg-white text-[#333] border-[#ddd] hover:bg-[#f5f5f5]'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Param slider */}
                              {(drawerState.operation === 'colorShift' || drawerState.operation === 'lighten' || drawerState.operation === 'darken' || drawerState.operation === 'setLightness' || drawerState.operation === 'setSaturation') && (
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-semibold text-[#666]">
                                      {drawerState.operation === 'colorShift' ? 'Color Shift' :
                                       drawerState.operation === 'lighten' ? 'Lighten' :
                                       drawerState.operation === 'darken' ? 'Darken' :
                                       drawerState.operation === 'setLightness' ? 'Lightness' : 'Saturation'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={drawerState.operation === 'colorShift' ? 360 : 100}
                                        value={drawerState.param}
                                        onChange={e => setDrawerState({ ...drawerState, param: Number(e.target.value) })}
                                        style={{ height: 28, width: 58, padding: '0 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#333', textAlign: 'right', outline: 'none', background: 'white' }}
                                      />
                                      <span className="text-[10px] text-[#ccc]">{drawerState.operation === 'colorShift' ? '°' : '%'}</span>
                                    </div>
                                  </div>
                                  <SingleTrack
                                    floor={0}
                                    ceil={drawerState.operation === 'colorShift' ? 360 : 100}
                                    value={drawerState.param}
                                    onChange={v => setDrawerState({ ...drawerState, param: v })}
                                  />
                                </div>
                              )}

                              {/* Formula */}
                              <div className="flex flex-col gap-2">
                                <span className="text-[12px] font-semibold text-[#666]">Formula</span>
                                <div className="h-9 border border-[#ddd] rounded-[10px] px-3 flex items-center bg-[#f5f5f5]">
                                  <span className="text-[12px] font-medium text-[#999] font-mono truncate">
                                    {getFormulaString(key, drawerState)}
                                  </span>
                                </div>
                              </div>
                            </>
                            )}
                            {/* Settings: range-based */}
                            {showRange && (() => {
                              const defaultRule = key === 'neutral'
                                ? { h: { min: 0, max: 360 }, s: { min: 0, max: 15 }, l: { min: 20, max: 75 } }
                                : DEFAULT_GENERATE_RULE;
                              const rangeAutoSettings = currentKgs?.autoSettings?.kind === 'range'
                                ? currentKgs.autoSettings as RangeGenSettings
                                : { kind: 'range' as const, rule: defaultRule };
                              return (
                              <div className="flex flex-col gap-3">
                                <span className="text-[12px] font-semibold text-[#666]">Range</span>
                                {(useOklch ? ['l', 's', 'h'] : ['h', 's', 'l']).map(channel => {
                                  const rangeSettings = rangeAutoSettings;
                                  const labelMap: Record<string, string> = useOklch ? { l: 'L', s: 'C', h: 'H' } : { h: 'H', s: 'S', l: 'L' };
                                  const unitMap: Record<string, string> = useOklch ? { l: '%', s: '%', h: '°' } : { h: '°', s: '%', l: '%' };
                                  return (
                                    <RangeRow
                                      key={channel}
                                      label={labelMap[channel]}
                                      floor={0}
                                      ceil={channel === 'h' ? 360 : 100}
                                      value={(rangeSettings.rule as any)[channel]}
                                      unit={unitMap[channel]}
                                      onChange={v => {
                                        const newRule = { ...(rangeSettings.rule as any), [channel]: v };
                                        setKeyGenSettings(key, { mode: globalGenerationMode === 'auto' ? 'auto' : (currentKgs?.mode ?? 'manual'), autoSettings: { kind: 'range', rule: newRule } });
                                      }}
                                    />
                                  );
                                })}
                              </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Drawer footer */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-[30px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resetDrawer(key)}
                        className="h-9 px-[10px] bg-[#f5f5f5] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
                      >
                        Reset
                      </button>
                      {globalGenerationMode !== 'manual' && (
                        <button
                          type="button"
                          className="h-9 px-[10px] bg-[#eef5ff] rounded-[10px] text-[13px] font-medium text-[#7490e7] hover:bg-[#ddeeff] transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="h-9 w-[90px] bg-[#f5f5f5] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveDrawer(key)}
                        className="h-9 w-[90px] bg-[#666] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#555] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
