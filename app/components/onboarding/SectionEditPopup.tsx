'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';

export type PanelSectionKey =
  | 'namespace' | 'theme' | 'category' | 'component'
  | 'type' | 'variant' | 'state';

const POPUP_W = 560;
const POPUP_H = 480;
const MARGIN  = 12;

function computePos(anchor: { x: number; y: number }) {
  let left = anchor.x + MARGIN;
  let top  = anchor.y + MARGIN;
  if (left + POPUP_W > window.innerWidth  - MARGIN) left = anchor.x - POPUP_W - MARGIN;
  if (top  + POPUP_H > window.innerHeight - MARGIN) top  = anchor.y - POPUP_H - MARGIN;
  return { left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) };
}

interface SectionEditPopupProps {
  sectionKey: PanelSectionKey;
  label: string;
  isSingle?: boolean;
  onClose: () => void;
  anchorPos?: { x: number; y: number };
}

function sanitizeTag(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function SectionEditPopup({
  sectionKey,
  label,
  isSingle,
  onClose,
  anchorPos,
}: SectionEditPopupProps) {
  const namingNamespaceFromStore = useColorStore(s => s.namingNamespace);
  const namingValuesFromStore = useColorStore(s => s.namingValues);
  const namingDescriptions = useColorStore(s => s.namingDescriptions);
  const setNamingNamespace = useColorStore(s => s.setNamingNamespace);
  const setNamingValue = useColorStore(s => s.setNamingValue);
  const setNamingDescription = useColorStore(s => s.setNamingDescription);
  const setDefaultNamingNamespace = useColorStore(s => s.setDefaultNamingNamespace);
  const setDefaultNamingValues = useColorStore(s => s.setDefaultNamingValues);
  const setDefaultNamingDescriptions = useColorStore(s => s.setDefaultNamingDescriptions);

  const [localEdit, setLocalEdit] = useState<string | string[]>(
    isSingle ? namingNamespaceFromStore : (namingValuesFromStore[sectionKey] ?? [])
  );
  const [localDesc, setLocalDesc] = useState(namingDescriptions[sectionKey] ?? '');
  const [inputVal, setInputVal] = useState('');
  const [showToast, setShowToast] = useState(false);

  const isDirty =
    (isSingle ? (localEdit as string) !== namingNamespaceFromStore : JSON.stringify(localEdit) !== JSON.stringify(namingValuesFromStore[sectionKey])) ||
    localDesc !== (namingDescriptions[sectionKey] ?? '');

  const handleSave = () => {
    if (isSingle) {
      setNamingNamespace(localEdit as string);
    } else {
      setNamingValue(sectionKey, (localEdit as string[]) ?? namingValuesFromStore[sectionKey] ?? []);
    }
    if (localDesc !== namingDescriptions[sectionKey]) {
      setNamingDescription(sectionKey, localDesc);
    }
    onClose();
  };

  const handleCancel = () => onClose();

  const handleReset = () => {
    const defaults = useColorStore.getState();
    if (sectionKey === 'namespace') {
      setLocalEdit(defaults.defaultNamingNamespace);
    } else {
      setLocalEdit([...(defaults.defaultNamingValues[sectionKey] ?? [])]);
    }
    setLocalDesc(defaults.defaultNamingDescriptions[sectionKey] ?? '');
  };

  const handleAddTag = () => {
    if (isSingle) return;
    const raw = inputVal.trim();
    const val = sanitizeTag(raw);
    if (!val) return;
    const list = (localEdit as string[]) ?? [];
    if (list.includes(val)) return;
    setLocalEdit([...list, val]);
    setInputVal('');
  };

  const handleRemoveTag = (tag: string) => {
    if (isSingle) return;
    const list = (localEdit as string[]) ?? [];
    setLocalEdit(list.filter(v => v !== tag));
  };

  const handleSetAsDefault = () => {
    if (isSingle) {
      setNamingNamespace(localEdit as string);
      setDefaultNamingNamespace(localEdit as string);
    } else {
      setNamingValue(sectionKey, (localEdit as string[]) ?? []);
      setDefaultNamingValues(sectionKey, (localEdit as string[]) ?? []);
    }
    setNamingDescription(sectionKey, localDesc);
    setDefaultNamingDescriptions(sectionKey, localDesc);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const pos = anchorPos ? computePos(anchorPos) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[560px] flex flex-col overflow-hidden max-h-[80vh]"
        style={pos ? { position: 'fixed', left: pos.left, top: pos.top } : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
      >
        {/* Header */}
        <div className="flex h-[70px] items-center justify-between px-6 shrink-0">
          <p className="font-semibold text-[16px] text-[#333]">{label}</p>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isSingle ? (
            <>
              <div>
                <input
                  type="text"
                  value={localEdit as string}
                  onChange={e => setLocalEdit(e.target.value)}
                  className="w-full h-9 border border-[#dddddd] rounded-[10px] px-3 text-[14px] font-normal text-[#333] outline-none focus:border-[#808088]"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {((localEdit as string[]) ?? []).map(tag => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 px-3 h-[30px] bg-[#333] rounded-[8px] text-[12px] font-medium text-[#fff]"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[10px] text-[#aaa] hover:text-[#fff]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                    placeholder="값 추가"
                    className="flex-1 h-9 border border-[#dddddd] rounded-[10px] px-3 text-[14px] font-normal text-[#333] outline-none focus:border-[#808088]"
                  />
                  <button
                    onClick={handleAddTag}
                    className="h-9 px-4 bg-[#666] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#555] transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2 text-[#333]">설명</label>
            <input
              type="text"
              value={localDesc}
              onChange={e => setLocalDesc(e.target.value)}
              placeholder="이 섹션의 설명을 입력하세요"
              className="w-full h-9 border border-[#dddddd] rounded-[10px] px-3 text-[14px] font-normal text-[#333] outline-none focus:border-[#808088]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-[30px] pt-4 pb-6 shrink-0">
          <div className="flex gap-2.5">
            <button
              onClick={handleReset}
              className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[14px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSetAsDefault}
              className="h-9 px-4 bg-[#e8eeff] rounded-[10px] text-[14px] font-medium text-[#4a7cf5] hover:bg-[#d8e4ff] transition-colors"
            >
              Set Default
            </button>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleCancel}
              className="h-9 w-[90px] bg-[#f5f5f5] rounded-[10px] text-[14px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-9 w-[90px] bg-[#666] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-[#333] text-white rounded-lg text-sm z-50">
            기본값으로 설정되었습니다
          </div>
        )}
      </div>
    </div>
  );
}
