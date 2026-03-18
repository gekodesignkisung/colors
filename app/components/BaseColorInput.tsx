'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useColorStore, ProjectData, DEFAULT_GENERATE_RULE, DEFAULT_KEY_GEN_SETTINGS } from '@/store/colorStore';
import KeyColorEditPopup from '@/app/components/KeyColorEditPopup';
import ColorPicker from '@/app/components/ColorPicker';
import OklchPicker from '@/app/components/OklchPicker';
import { RangeRow, SingleTrack } from '@/app/components/RangeRow';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';
import { buildFormulaString } from '@/lib/generateTokens';
import { OpGenSettings, KeyColorGenSettings, KeyColorAutoSettings, Stage1Op, TokenOperation, RangeGenSettings } from '@/types/tokens';

/** Format OKLCH values for display: oklch(0.55 0.18 293°) */
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

interface BaseColorInputProps {
  introStep?: number;
  onNext?: () => void;
  onNewProject?: () => void;
  leftTab?: 'colors' | 'tokens';
  setLeftTab?: (tab: 'colors' | 'tokens') => void;
  namingPanel?: React.ReactNode;
}

export default function BaseColorInput({ introStep, onNext, onNewProject, leftTab, setLeftTab, namingPanel }: BaseColorInputProps) {
  const {
    baseColors, groupOrder, groupLabels, groupDescriptions,
    setBaseColor, setGroupLabel, setGroupDescription,
    addGroup, removeGroup, randomizeColors,
    useOklch, toggleOklch,
    projectName, setProjectName,
    newProject, saveProject, loadProject,
    keyGenSettings, setKeyGenSettings,
    globalGenerationMode, setGlobalGenerationMode,
    groupEnabled, setGroupEnabled,
  } = useColorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [openKey, setOpenKey] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const newNameInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.replace(/\.json$/i, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ProjectData;
        // Use filename as project name if not stored in file
        if (!data.projectName) data.projectName = fileName;
        loadProject(data);
      } catch {
        alert('올바른 디자인 시스템 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEditingName = () => {
    setNameInput(projectName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commitName = () => {
    const trimmed = nameInput.trim();
    setProjectName(trimmed || 'Untitled');
    setEditingName(false);
  };

  // Drawer helpers
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

  const menuItems = [
    {
      label: 'New project',
      onClick: () => {
        setShowMenu(false);
        newProject();
        onNewProject?.();
      },
    },
    {
      label: 'Open file',
      onClick: () => {
        setShowMenu(false);
        fileInputRef.current?.click();
      },
    },
    {
      label: 'Save as',
      onClick: () => {
        setShowMenu(false);
        saveProject(true);
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#404050] px-[15px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-opencolor.svg" alt="OpenColor" height={30} />

        {/* Tab menu */}
        {setLeftTab && (
          <div className="flex items-end h-full">
            <button
              type="button"
              onClick={() => setLeftTab('colors')}
              className={`h-[40px] px-[20px] text-[13px] font-semibold transition-colors ${leftTab === 'colors' ? 'bg-white text-[#333]' : 'bg-white/50 text-white hover:bg-white/70'}`}
            >
              Key Colors
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('tokens')}
              className={`h-[40px] px-[20px] text-[13px] font-semibold transition-colors ${leftTab === 'tokens' ? 'bg-white text-[#333]' : 'bg-white/50 text-white hover:bg-white/70'}`}
            >
              Token Rules
            </button>
          </div>
        )}

        {/* Menu button */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            title="메뉴"
            onClick={() => setShowMenu(prev => !prev)}
            className="flex items-center justify-center w-8 h-8 hover:opacity-70 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-menu.svg" alt="" width={30} height={30} aria-hidden="true" />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-[10px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)] overflow-hidden z-50">
              {menuItems.map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`flex items-center w-full px-4 h-[44px] text-left text-[13px] font-medium text-[#333] hover:bg-[#f5f5f5] transition-colors
                    ${i > 0 ? 'border-t border-[#f0f0f0]' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for load */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        aria-label="디자인 시스템 파일 불러오기"
        className="hidden"
        onChange={handleLoadFile}
      />

      {/* Info row */}
      {leftTab !== 'tokens' && <div className="flex items-center justify-between shrink-0 h-[40px] bg-white border-b border-[#dddddf] px-[15px]">
        <span className="text-[13px] font-semibold text-[#999]">Project name</span>
        {/* actual project name (click to edit) */}
        {editingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            aria-label="프로젝트 이름"
            className="text-[13px] font-normal text-[#333] bg-transparent outline-none border-b border-[#aaa] min-w-0 text-right"
          />
        ) : (
          <button
            type="button"
            onClick={startEditingName}
            className="text-[13px] font-normal text-[#333] truncate hover:text-[#555] transition-colors min-w-0 text-right"
          >
            {projectName}
          </button>
        )}
      </div>}

      {/* Token Rules tab content */}
      {leftTab === 'tokens' && namingPanel && (
        <div className="flex-1 overflow-y-auto">{namingPanel}</div>
      )}

      {/* Content area */}
      <div className={`flex-1 overflow-y-auto p-0 ${leftTab === 'tokens' ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-0">
          {/* Color cards */}
          <div className="flex flex-col gap-0">
            {groupOrder.map((key, idx) => {
              const label = groupLabels[key] ?? key;
              const raw = baseColors[key] ?? '#000000';
              const colorValue = useOklch ? toOklchLabel(raw) : raw.toUpperCase();
              const enabled = groupEnabled[key] ?? true;
              const isOpen = openKey === key;
              const kgs = keyGenSettings[key];
              const isAuto = globalGenerationMode === 'auto';
              const isRangeKey = key === 'primary' || key === 'neutral';
              let formulaLabel: string | null = null;
              if (!isRangeKey && kgs?.autoSettings.kind === 'operation') {
                const op = kgs.autoSettings as OpGenSettings;
                const srcLabel = groupLabels[op.sourceKey] ?? op.sourceKey ?? 'Primary';
                formulaLabel = buildFormulaString(label, op, srcLabel);
              } else if (isRangeKey) {
                formulaLabel = 'Range based';
              }

              const cardAndDrawer = (
                <div key={key} className="border-b border-[#dddddf]">
                  {/* Card row — original design */}
                  <div
                    className="flex items-center min-h-[44px] w-full px-5 py-[8px]"
                  >
                    <div className={`flex items-center flex-1 transition-opacity duration-300 ${enabled ? '' : 'opacity-30'}`}>
                      {/* Swatch */}
                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={e => { e.stopPropagation(); setPickerKey(key); setPickerPos({ x: e.clientX, y: e.clientY }); }}
                        className={`shrink-0 transition-transform ${enabled ? 'hover:scale-110' : ''}`}
                        title="클릭하여 색상 선택"
                      >
                        <ColorShape color={!enabled ? '#ffffff' : raw} size={60} />
                      </button>
                      {/* Label + value — hover only on info area */}
                      <button
                        type="button"
                        onClick={() => openDrawer(key)}
                        disabled={!enabled}
                        title="Click to configure"
                        className={`flex flex-col gap-[2px] justify-center flex-1 min-w-0 text-left border-0 bg-transparent py-2 rounded-[10px] hover:bg-[#f5f5f5] transition-colors ml-[20px] px-3 ${enabled ? 'cursor-pointer' : 'pointer-events-none'}`}
                      >
                        <span className="text-[18px] font-semibold text-[#333]">{label}</span>
                        <div className={`flex flex-col gap-0 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-0'}`}>
                          <span key={colorValue} className="text-[13px] font-medium text-[#999] whitespace-nowrap">{colorValue}</span>
                          <span className={`text-[13px] font-medium text-[#333] whitespace-nowrap transition-opacity duration-300 ${formulaLabel && isAuto ? 'opacity-100' : 'opacity-0'}`}>{formulaLabel ?? '\u00A0'}</span>
                        </div>
                      </button>
                    </div>
                    {/* Switch (secondary, tertiary only) */}
                    {(key === 'secondary' || key === 'tertiary') ? (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); if (openKey === key) { closeDrawer(); setTimeout(() => setGroupEnabled(key, !enabled), 300); } else { setGroupEnabled(key, !enabled); } }}
                        className="flex items-center justify-center border-0 bg-transparent hover:scale-[1.2] transition-transform duration-200 shrink-0 pointer-events-auto"
                        style={{ width: 48, height: 48, margin: -8, marginLeft: 2 }}
                      >
                        <div className="relative w-5 h-8">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icon-switch2-on.svg" alt="" width={20} height={32} className={`block w-5 h-8 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-0'}`} />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icon-switch2-off.svg" alt="" width={20} height={32} className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${enabled ? 'opacity-0' : 'opacity-100'}`} />
                        </div>
                      </button>
                    ) : null}
                  </div>

                  {/* Drawer */}
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      {drawerState && openKey === key && (
                        <div className="bg-white">
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
                                  /* Auto mode */
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

              // after fourth card, place next button if at step0
              if (idx === 3 && introStep === 0 && onNext) {
                return (
                  <React.Fragment key="after-4">
                    {cardAndDrawer}
                    <div className="p-3">
                      <button
                        type="button"
                        className="w-[90px] h-[90px] bg-white text-[#999] border-2 border-[#999] rounded-full flex items-center justify-center mx-auto whitespace-nowrap mt-[30px]"
                        onClick={onNext}
                      >
                        Next
                      </button>
                    </div>
                  </React.Fragment>
                );
              }
              return cardAndDrawer;
            })}
          </div>

          {/* Bottom toggles */}
          <div className="flex items-center gap-[20px] p-[20px] pr-[40px]">
        {/* Generate button */}
        <button
          type="button"
          onClick={randomizeColors}
          className={`shrink-0 w-[60px] h-[60px] bg-white border border-[#999] rounded-full shadow-[0px_3px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity duration-300 ${globalGenerationMode === 'auto' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-generate.svg" alt="" width={22} height={22} aria-hidden="true" />
        </button>

        {/* Auto Generation */}
        <button
          type="button"
          onClick={() => setGlobalGenerationMode(globalGenerationMode === 'auto' ? 'manual' : 'auto')}
          className="flex flex-1 items-center gap-[20px] h-[60px] min-w-0 bg-[#f5f5f5] rounded-[10px] px-[15px] cursor-pointer border-0 text-left"
        >
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <p className="font-semibold text-[12px] text-[#333] leading-[1.3] whitespace-nowrap">Auto</p>
            <p className="font-semibold text-[12px] text-[#333] leading-[1.3] whitespace-nowrap">Generation</p>
          </div>
          <div className="-rotate-90 shrink-0">
            <div className={`w-[32px] h-[20px] rounded-full transition-colors duration-300 flex items-center px-[3px] ${globalGenerationMode === 'auto' ? 'bg-[#606070] justify-end' : 'bg-[#ccc] justify-start'}`}>
              <div className="w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </button>

        {/* OKLCH Color Space */}
        <button
          type="button"
          onClick={toggleOklch}
          className="flex flex-1 items-center gap-[20px] h-[60px] min-w-0 bg-[#f5f5f5] rounded-[10px] px-[15px] cursor-pointer border-0 text-left"
        >
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <p className="font-semibold text-[12px] text-[#333] leading-[1.3] whitespace-nowrap">OKLCH</p>
            <p className="font-semibold text-[12px] text-[#333] leading-[1.3] whitespace-nowrap">Color Space</p>
          </div>
          <div className="-rotate-90 shrink-0">
            <div className={`w-[32px] h-[20px] rounded-full transition-colors duration-300 flex items-center px-[3px] ${useOklch ? 'bg-[#606070] justify-end' : 'bg-[#ccc] justify-start'}`}>
              <div className="w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </button>
          </div>

        </div>
      </div>

      {/* Direct color picker (swatch click) */}
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

      {/* Create popup */}
      {creatingGroup && (
        <KeyColorEditPopup
          colorKey="New Group"
          initialHex="#6750A4"
          initialLabel=""
          initialDescription=""
          isCore={false}
          globalGenerationMode={globalGenerationMode}
          onSave={(hex, label, desc) => {
            const finalLabel = label.trim() || 'New Group';
            addGroup(finalLabel, hex, desc);
          }}
          onClose={() => setCreatingGroup(false)}
        />
      )}

      {/* New project dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[400px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex h-[70px] items-center justify-between px-6 shrink-0">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-[16px] text-[#333]">New project</p>
                <p className="text-[12px] font-medium text-[#999]">프로젝트 이름을 입력하세요</p>
              </div>
              <button
                type="button"
                title="닫기"
                onClick={() => setShowNewDialog(false)}
                className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Project name</label>
              <input
                ref={newNameInputRef}
                type="text"
                value={newSystemName}
                onChange={e => setNewSystemName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    newProject();
                    setProjectName(newSystemName.trim() || 'Untitled');
                    setShowNewDialog(false);
                    onNewProject?.();
                  }
                  if (e.key === 'Escape') setShowNewDialog(false);
                }}
                placeholder="Untitled"
                aria-label="새 프로젝트 이름"
                className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
              />
            </div>
            {/* Footer */}
            <div className="flex h-[70px] items-center justify-end gap-2.5 px-[30px] shrink-0">
              <button
                type="button"
                onClick={() => setShowNewDialog(false)}
                className="h-9 w-[90px] bg-[#f5f5f5] rounded-[10px] text-[14px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  newProject();
                  setProjectName(newSystemName.trim() || 'Untitled');
                  setShowNewDialog(false);
                  onNewProject?.();
                }}
                className="h-9 w-[90px] bg-[#666] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#555] transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
