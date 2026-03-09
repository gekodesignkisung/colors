'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore, ProjectData } from '@/store/colorStore';
import KeyColorEditPopup from '@/app/components/KeyColorEditPopup';
import ColorPicker from '@/app/components/ColorPicker';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';
import { buildFormulaString } from '@/lib/generateTokens';
import { OpGenSettings } from '@/types/tokens';

/** Format OKLCH values for display: oklch(0.55 0.18 293°) */
function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `oklch(${l.toFixed(2)} ${c.toFixed(3)} ${Math.round(h)}°)`;
}

/** Get display text for a color card in Auto mode */
function getAutoModeDisplay(
  colorKey: string,
  keyGenSettings: Record<string, any>,
  groupLabels: Record<string, string>,
): string {
  const kgs = keyGenSettings[colorKey];
  if (!kgs || kgs.autoSettings.kind !== 'operation') {
    return 'Range-based';
  }
  const opSettings = kgs.autoSettings as OpGenSettings;
  const keyLabel = groupLabels[colorKey] ?? colorKey;
  const sourceLabel = groupLabels[opSettings.sourceKey] ?? opSettings.sourceKey;
  return buildFormulaString(keyLabel, opSettings, sourceLabel);
}

const CORE_KEYS = new Set(['primary', 'secondary', 'tertiary', 'neutral']);

export default function BaseColorInput() {
  const {
    baseColors, groupOrder, groupLabels, groupDescriptions,
    setBaseColor, setGroupLabel, setGroupDescription,
    addGroup, removeGroup, randomizeColors,
    useOklch, toggleOklch,
    projectName, setProjectName,
    newProject, saveProject, loadProject,
    keyGenSettings, setKeyGenSettings,
    globalGenerationMode, setGlobalGenerationMode,
  } = useColorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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

  const handleSave = (key: string, hex: string, label: string, desc: string) => {
    setBaseColor(key, hex);
    setGroupLabel(key, label);
    setGroupDescription(key, desc);
  };

  const menuItems = [
    {
      label: 'New project',
      onClick: () => {
        setShowMenu(false);
        setNewSystemName('');
        setShowNewDialog(true);
        setTimeout(() => newNameInputRef.current?.focus(), 50);
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
      <div className="flex items-center justify-between shrink-0 h-[40px] bg-[#f5f5f5] border-b border-[#dddddf] px-[20px]">
        {editingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            aria-label="프로젝트 이름"
            className="flex-1 text-[13px] font-semibold text-[#333] bg-transparent outline-none border-b border-[#aaa] min-w-0"
          />
        ) : (
          <button
            type="button"
            onClick={startEditingName}
            className="flex-1 text-left text-[13px] font-semibold text-[#333] truncate hover:text-[#555] transition-colors min-w-0"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-0">
        <div className="flex flex-col gap-0">
          {/* Key color generation mode selector */}
          <div className="flex items-center justify-between shrink-0 h-[50px] bg-white border-b border-[#ebebeb] px-5">
            <span className="text-[12px] font-semibold text-[#666]">Key color generation</span>
            <select
              value={globalGenerationMode}
              onChange={e => setGlobalGenerationMode(e.target.value as 'manual' | 'auto')}
              className="h-7 px-3 pr-8 border border-[#ddd] rounded-[6px] text-[12px] font-medium text-[#333] outline-none focus:border-[#808088] bg-white accent-[#999]"
            >
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Color cards */}
          <div className="flex flex-col gap-0 pt-2">
            {groupOrder.map((key) => {
              const label = groupLabels[key] ?? key;
              const raw = baseColors[key] ?? '#000000';
              const valueDisplay = globalGenerationMode === 'auto'
                ? getAutoModeDisplay(key, keyGenSettings, groupLabels)
                : (useOklch ? toOklchLabel(raw) : raw.toUpperCase());
              return (
                <div
                  key={key}
                  className="flex items-center min-h-[64px] w-full px-5 py-2 hover:bg-[#f5f5f5] transition-colors border-b border-[#f0f0f0]"
                >
                  {/* Swatch — 클릭 시 바로 ColorPicker */}
                  <button
                    type="button"
                    onClick={e => { setPickerKey(key); setPickerPos({ x: e.clientX, y: e.clientY }); }}
                    className="shrink-0 hover:scale-110 transition-transform"
                    title="클릭하여 색상 선택"
                  >
                    <ColorShape color={raw} size={48} />
                  </button>
                  {/* Label + value — 클릭 시 KeyColorEditPopup */}
                  <button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className="pl-4 flex flex-col gap-0.5 flex-1 text-left min-w-0"
                  >
                    <span className="font-semibold text-sm text-[#333333] leading-tight">{label}</span>
                    <span className="text-xs font-medium text-[#999999] font-mono">
                      {valueDisplay}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Add key color button — same height as color card */}
            <button
              type="button"
              title="키컬러 추가하기"
              onClick={() => setCreatingGroup(true)}
              className="flex items-center justify-center min-h-[64px] w-full px-5 py-2 hover:bg-[#f5f5f5] transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-add.svg" alt="" width={32} height={32} aria-hidden="true" />
            </button>
          </div>

          {/* Generate button */}
          <div className="p-5">
            <button
              type="button"
              onClick={randomizeColors}
              className="w-full flex items-center justify-center h-[50px] bg-white border border-[#999] rounded-full shadow-[0px_3px_6px_0px_rgba(0,0,0,0.1)] gap-2 cursor-pointer hover:opacity-75 transition-opacity"
            >
              <div className="flex items-center justify-center shrink-0 w-8 h-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-generate.svg" alt="" width={22} height={22} aria-hidden="true" />
              </div>
              <span className="font-semibold text-sm text-[#333333]">Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* OKLCH toggle */}
      <div className="shrink-0 px-5 py-3 border-t border-[#ebebeb] bg-white">
        <button
          type="button"
          title={useOklch ? 'OKLCH mode on' : 'OKLCH mode off'}
          aria-label="Generate colors by OKLCH"
          onClick={toggleOklch}
          className="flex items-center justify-between w-full group"
        >
          <div className="text-left">
            <p className={`text-xs font-semibold leading-tight transition-colors ${useOklch ? 'text-[#707077]' : 'text-[#333]'}`}>
              Generate with OKLCH
            </p>
            <p className="text-[11px] text-[#aaa] mt-0.5 leading-tight">Perceptually uniform color space</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={useOklch ? '/icon-switch-on.svg' : '/icon-switch-off.svg'} alt="" width={40} height={24} aria-hidden="true" />
        </button>
      </div>

      {/* Direct color picker (swatch click) */}
      {pickerKey && (
        <div className="fixed inset-0 z-50">
          <ColorPicker
            color={baseColors[pickerKey] ?? '#000000'}
            anchorPos={pickerPos ?? undefined}
            onChange={hex => setBaseColor(pickerKey, hex)}
            onClose={savedHex => {
              if (savedHex) setBaseColor(pickerKey, savedHex);
              setPickerKey(null);
            }}
          />
        </div>
      )}

      {/* Edit popup */}
      {selectedKey && (
        <KeyColorEditPopup
          colorKey={selectedKey}
          initialHex={baseColors[selectedKey] ?? '#000000'}
          initialLabel={groupLabels[selectedKey] ?? selectedKey}
          initialDescription={groupDescriptions[selectedKey] ?? ''}
          isCore={CORE_KEYS.has(selectedKey)}
          globalGenerationMode={globalGenerationMode}
          onSave={(hex, label, desc) => handleSave(selectedKey, hex, label, desc)}
          onClose={() => setSelectedKey(null)}
          onRemove={!CORE_KEYS.has(selectedKey) ? () => removeGroup(selectedKey) : undefined}
        />
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
