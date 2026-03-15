// This file is a copy of BaseColorInput.tsx with modifications specific to Step2
// The original BaseColorInput is left untouched for use on the main page.

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useColorStore, ProjectData } from '@/store/colorStore';
import KeyColorEditPopup from '@/app/components/KeyColorEditPopup';
import ColorPicker from '@/app/components/ColorPicker';
import OklchPicker from '@/app/components/OklchPicker';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';
import { buildFormulaString } from '@/lib/generateTokens';
import { OpGenSettings } from '@/types/tokens';

/** ... same helper functions ... */
function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)}°`;
}

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

interface BaseColorInputProps {
  introStep?: number;
  onNext?: () => void;
}

export default function Step2BaseColorInput({ introStep, onNext }: BaseColorInputProps) {
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

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editPopupPos, setEditPopupPos] = useState<{ x: number; y: number } | null>(null);
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


      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        aria-label="디자인 시스템 파일 불러오기"
        className="hidden"
        onChange={handleLoadFile}
      />



      {/* Content area with modified row design */}
      <div className="flex-1 overflow-y-auto p-0">
        <div className="flex flex-col gap-0">
          <div className="flex flex-col pt-2">
            {groupOrder.map((key, idx) => {
              const label = groupLabels[key] ?? key;
              const raw = baseColors[key] ?? '#000000';
              const colorValue = useOklch ? toOklchLabel(raw) : raw.toUpperCase();
              const formulaDisplay = globalGenerationMode === 'auto'
                ? getAutoModeDisplay(key, keyGenSettings, groupLabels)
                : null;
              const enabled = groupEnabled[key] ?? true;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between h-[100px] px-6 border-b border-[#f0f0f0]"
                >
                  <div className={`flex items-center gap-4 flex-1 min-w-0 transition-opacity duration-300 ${!enabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <button
                      type="button"
                      className="shrink-0"
                      onClick={e => { setPickerKey(key); setPickerPos({ x: e.clientX, y: e.clientY }); }}
                      title="Click to pick color"
                    >
                      <div className={`w-[200px] h-[60px] rounded-full transition-all duration-300 ${!enabled ? 'opacity-0' : ''}`} style={{ backgroundColor: raw }}></div>
                    </button>
                    <div className="flex flex-col text-left pl-[20px]">
                      <span className="text-[16px] font-semibold text-[#333]">{label}</span>
                      {enabled && (
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-[#888]">{colorValue}</span>
                          {formulaDisplay && (
                            <span className="text-[13px] text-[#888]">{formulaDisplay}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-9 shrink-0">
                    <button
                      type="button"
                      onClick={e => { setSelectedKey(key); setEditPopupPos({ x: e.clientX, y: e.clientY }); }}
                      className={`flex items-center justify-center w-[30px] h-[30px] transition-transform hover:scale-[1.2] transition-opacity duration-300 ${(key === 'secondary' || key === 'tertiary') && !enabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
                      title="Color settings"
                    >
                      <img
                        src={globalGenerationMode === 'auto' ? '/icon-settings.svg' : '/icon-setting.svg'}
                        alt="settings"
                        width={30}
                        height={30}
                      />
                    </button>
                    {(key === 'secondary' || key === 'tertiary') ? (
                      <button
                        type="button"
                        onClick={() => { setGroupEnabled(key, !enabled); }}
                        className="flex items-center justify-center cursor-pointer border-0 bg-transparent"
                        style={{ width: 48, height: 48, margin: -8 }}
                      >
                        <div className="relative w-5 h-8 shrink-0">
                          <img src="/icon-switch2-on.svg" alt="" width={20} height={32} aria-hidden="true" className={`block w-5 h-8 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-0'}`} />
                          <img src="/icon-switch2-off.svg" alt="" width={20} height={32} aria-hidden="true" className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${enabled ? 'opacity-0' : 'opacity-100'}`} />
                        </div>
                      </button>
                    ) : (
                      <div style={{ width: 32 }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* bottom generate and toggles row */}
          <div className="flex items-center gap-[40px] pl-5 py-5">
            {globalGenerationMode === 'auto' ? (
              <button
                type="button"
                onClick={randomizeColors}
                className="w-[200px] h-[60px] bg-white border border-[#999] rounded-[50px] shadow-[0px_3px_10px_rgba(0,0,0,0.1)] flex items-center justify-center gap-[10px] shrink-0"
              >
                <img src="/icon-generate.svg" alt="" width={22} height={22} />
                <span className="font-semibold text-[16px] text-[#333]">Generate</span>
              </button>
            ) : (
              <div className="w-[200px] h-[60px] shrink-0"></div>
            )}
            <div className="flex items-center gap-[15px]">
              {/* Auto Generation card */}
              <button
                type="button"
                onClick={() => setGlobalGenerationMode(globalGenerationMode === 'auto' ? 'manual' : 'auto')}
                className="w-[255px] h-[60px] bg-[#f5f5f5] rounded-[10px] flex items-center justify-between px-[15px] p-0 border-0 shrink-0"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[14px] font-semibold text-[#333] whitespace-nowrap">Auto Generation</span>
                  <span className="text-[11px] text-[#999] whitespace-nowrap">Generate all key colors automatically</span>
                </div>
                <div className="relative w-5 h-8 shrink-0">
                  <img src="/icon-switch2-on.svg" alt="" width={20} height={32} className={`block w-5 h-8 transition-opacity duration-300 ${globalGenerationMode === 'auto' ? 'opacity-100' : 'opacity-0'}`} />
                  <img src="/icon-switch2-off.svg" alt="" width={20} height={32} className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${globalGenerationMode === 'auto' ? 'opacity-0' : 'opacity-100'}`} />
                </div>
              </button>
              {/* OKLCH card */}
              <button
                type="button"
                onClick={toggleOklch}
                className="w-[255px] h-[60px] bg-[#f5f5f5] rounded-[10px] flex items-center justify-between px-[15px] p-0 border-0 shrink-0"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[14px] font-semibold text-[#333] whitespace-nowrap">OKLCH Color Space</span>
                  <span className="text-[11px] text-[#999] whitespace-nowrap">Perceptually uniform color space</span>
                </div>
                <div className="relative w-5 h-8 shrink-0">
                  <img src="/icon-switch2-on.svg" alt="" width={20} height={32} className={`block w-5 h-8 transition-opacity duration-300 ${useOklch ? 'opacity-100' : 'opacity-0'}`} />
                  <img src="/icon-switch2-off.svg" alt="" width={20} height={32} className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${useOklch ? 'opacity-0' : 'opacity-100'}`} />
                </div>
              </button>
            </div>
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

      {/* Edit popup */}
      {selectedKey && (
        <KeyColorEditPopup
          anchorPos={editPopupPos ?? undefined}
          colorKey={selectedKey}
          initialHex={baseColors[selectedKey] ?? '#000000'}
          initialLabel={groupLabels[selectedKey] ?? selectedKey}
          initialDescription={groupDescriptions[selectedKey] ?? ''}
          isCore={CORE_KEYS.has(selectedKey)}
          globalGenerationMode={globalGenerationMode}
          onSave={(hex, label, desc) => handleSave(selectedKey, hex, label, desc)}
          onClose={() => { setSelectedKey(null); setEditPopupPos(null); }}
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
