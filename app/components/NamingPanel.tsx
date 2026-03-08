'use client';

import { useState } from 'react';
import { useColorStore, DEFAULT_NAMING_NAMESPACE, DEFAULT_NAMING_VALUES } from '@/store/colorStore';



// ─── Types ────────────────────────────────────────────────────────────────────
type SectionKey =
  | 'namespace' | 'theme' | 'category' | 'component'
  | 'type' | 'variant' | 'state';

// ─── Config ───────────────────────────────────────────────────────────────────
const SECTIONS: { key: SectionKey; label: string; desc: string; isSingle?: boolean }[] = [
  { key: 'namespace', label: 'Namespace', desc: '전체 토큰을 구분하는 최상위 식별자',              isSingle: true },
  { key: 'theme',     label: 'Theme',     desc: 'CSS scope로 처리 (토큰명에 포함 안 됨)' },
  { key: 'category',  label: 'Category',  desc: '토큰의 속성 유형 (color, typography..)' },
  { key: 'variant',   label: 'Variant',   desc: '색상 역할' },
  { key: 'type',      label: 'Type',      desc: '컬러 적용 대상' },
  { key: 'state',     label: 'State',     desc: 'UI 인터랙션 상태' },
  { key: 'component', label: 'Component', desc: '2단계 alias 레이어에 적용' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function NamingPanel() {
  // ── Store state ──
  const namingNamespace = useColorStore(s => s.namingNamespace);
  const namingOrder     = useColorStore(s => s.namingOrder);
  const namingEnabled   = useColorStore(s => s.namingEnabled);
  const namingValues    = useColorStore(s => s.namingValues);
  const setNamingNamespace = useColorStore(s => s.setNamingNamespace);
  const setNamingEnabled   = useColorStore(s => s.setNamingEnabled);
  const setNamingValue     = useColorStore(s => s.setNamingValue);

  // ── Local UI state ──
  const [expandedKey, setExpandedKey] = useState<SectionKey | null>(null);
  const [localEdit,   setLocalEdit]   = useState<Record<string, string | string[]>>({});
  const [inputVal,    setInputVal]    = useState('');

  // ── Preview token string ──
  const previewStr = namingOrder
    .filter(k => namingEnabled.includes(k))
    .map(k => k === 'namespace' ? (namingNamespace || 'ns') : ((namingValues[k] ?? [])[0] ?? k))
    .join('.');

  const isDirty = (key: SectionKey): boolean => {
    if (!(key in localEdit)) return false;
    if (key === 'namespace') return (localEdit.namespace as string) !== namingNamespace;
    const saved   = namingValues[key] ?? [];
    const edited  = (localEdit[key] as string[]) ?? [];
    return JSON.stringify(edited) !== JSON.stringify(saved);
  };

  const openSection = (key: SectionKey) => {
    if (expandedKey === key) {
      if (!isDirty(key)) setExpandedKey(null); // 수정 없으면 토글 닫기 허용
      return;
    }
    setExpandedKey(key);
    const currentVal = key === 'namespace' ? namingNamespace : [...(namingValues[key] ?? [])];
    setLocalEdit(prev => ({ ...prev, [key]: currentVal }));
    setInputVal('');
  };

  const toggleEnabled = (key: SectionKey, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(namingEnabled);
    next.has(key) ? next.delete(key) : next.add(key);
    setNamingEnabled([...next]);
  };

  const handleSave = (key: SectionKey) => {
    if (key === 'namespace') {
      setNamingNamespace((localEdit.namespace as string) ?? namingNamespace);
    } else {
      setNamingValue(key, (localEdit[key] as string[]) ?? namingValues[key] ?? []);
    }
    setExpandedKey(null);
  };

  const handleCancel = () => setExpandedKey(null);

  const handleReset = (key: SectionKey) => {
    if (key === 'namespace') {
      setLocalEdit(prev => ({ ...prev, namespace: DEFAULT_NAMING_NAMESPACE }));
    } else {
      setLocalEdit(prev => ({ ...prev, [key]: [...(DEFAULT_NAMING_VALUES[key] ?? [])] }));
    }
  };

  const addTag = (key: SectionKey) => {
    const raw = inputVal.trim();
    const val = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!val) return;
    const list = (localEdit[key] ?? namingValues[key] ?? []) as string[];
    if (list.includes(val)) return;
    setLocalEdit(prev => ({ ...prev, [key]: [...list, val] }));
    setInputVal('');
  };

  const removeTag = (key: SectionKey, tag: string) => {
    const list = (localEdit[key] ?? namingValues[key] ?? []) as string[];
    setLocalEdit(prev => ({ ...prev, [key]: list.filter(v => v !== tag) }));
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-[56px] bg-[#606070] px-[15px]">
        <span className="font-semibold text-[16px] text-white">Token Naming Rules</span>
        <button type="button" className="flex items-center justify-center w-[30px] h-[30px] hover:opacity-70 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-add.svg" alt="" width={30} height={30} aria-hidden="true" />
        </button>
      </div>

      {/* Preview row */}
      <div className="flex items-center justify-between shrink-0 h-[40px] bg-[#f5f5f5] border-b border-[#dddddf] px-[20px]">
        <span className="font-semibold text-[13px] text-[#999]">Form</span>
        <span className="text-[13px] text-[#333] font-mono truncate ml-4 text-right">{previewStr || '—'}</span>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map(sec => {
          const isOn       = namingEnabled.includes(sec.key);
          const isExpanded = expandedKey === sec.key;
          const editList   = (localEdit[sec.key] ?? namingValues[sec.key] ?? []) as string[];

          return (
            <div key={sec.key} className="border-b border-[#dddddf]">

              {/* Row header */}
              <button
                type="button"
                className={`flex items-center gap-[10px] h-[70px] w-full px-[15px] text-left transition-colors
                  ${isExpanded && isDirty(sec.key) ? 'cursor-default' : 'hover:bg-[#fafafa]'}`}
                onClick={() => openSection(sec.key)}
              >
                <div className="flex flex-1 flex-col gap-1 justify-center min-w-0">
                  <div className="flex items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Icon-bullet-dn.svg"
                      alt=""
                      width={20}
                      height={20}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                    <span className="font-semibold text-sm text-[#333]">{sec.label}</span>
                  </div>
                  <span className="text-[12px] font-medium text-[#999] pl-[20px]">{sec.desc}</span>
                </div>

                {/* Toggle switch */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isOn ? '/icon-switch-on.svg' : '/icon-switch-off.svg'}
                  alt=""
                  width={40}
                  height={24}
                  aria-hidden="true"
                  onClick={e => toggleEnabled(sec.key, e)}
                  className="shrink-0 cursor-pointer"
                />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="flex flex-col gap-[20px] px-[20px] pt-[20px] pb-[20px]">
                  {sec.isSingle ? (
                    <input
                      type="text"
                      value={(localEdit.namespace ?? namingNamespace) as string}
                      onChange={e => setLocalEdit(prev => ({
                        ...prev,
                        namespace: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                      }))}
                      placeholder="e.g. krds"
                      className="h-[30px] border border-[#ccc] rounded-[8px] px-3 text-[13px] font-mono text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
                    />
                  ) : (
                    <>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-[6px] min-h-[22px]">
                        {editList.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-[4px] h-[26px] pl-[8px] pr-[4px] rounded-[50px] bg-[#606070] text-white text-[12px] font-semibold shrink-0"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(sec.key, tag)}
                              className="flex items-center justify-center w-[16px] h-[16px] shrink-0"
                              aria-label={`${tag} 제거`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/icon-del.svg" alt="" width={16} height={16} aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                        {editList.length === 0 && (
                          <span className="text-[11px] text-[#ccc] italic">값 없음</span>
                        )}
                      </div>

                      {/* Add input */}
                      <div className="flex items-center gap-[6px]">
                        <input
                          type="text"
                          value={inputVal}
                          onChange={e => setInputVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addTag(sec.key); }}
                          placeholder="토큰 추가..."
                          className="flex-1 h-[30px] border border-[#ccc] rounded-[8px] px-3 text-[12px] text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
                        />
                        <button
                          type="button"
                          onClick={() => addTag(sec.key)}
                          className="shrink-0 w-[30px] h-[30px] flex items-center justify-center hover:opacity-70 transition-opacity"
                          aria-label="추가"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icon-add-item.svg" alt="" width={30} height={30} aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Footer buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleReset(sec.key)}
                      className="h-[30px] px-3 bg-[#f5f5f5] rounded-[8px] text-[12.5px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
                    >
                      Reset
                    </button>
                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="h-[30px] w-[70px] bg-[#f5f5f5] rounded-[8px] text-[12.5px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(sec.key)}
                        className="h-[30px] w-[70px] bg-[#666] rounded-[8px] text-[12.5px] font-medium text-white hover:bg-[#555] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
