'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PanelSectionKey } from '@/app/components/onboarding/SectionEditPopup';

type SectionKey = PanelSectionKey;

const SECTIONS: { key: SectionKey; label: string; desc: string; isSingle?: boolean }[] = [
  { key: 'namespace', label: 'Namespace', desc: '전체 토큰을 구분하는 최상위 식별자', isSingle: true },
  { key: 'theme',     label: 'Theme',     desc: 'CSS scope로 처리 (토큰명에 포함 안 됨)' },
  { key: 'category',  label: 'Category',  desc: '토큰의 속성 유형 (color, typography..)' },
  { key: 'variant',   label: 'Variant',   desc: '색상 역할' },
  { key: 'type',      label: 'Type',      desc: '컬러 적용 대상' },
  { key: 'state',     label: 'State',     desc: 'UI 인터랙션 상태' },
  { key: 'component', label: 'Component', desc: '2단계 alias 레이어에 적용' },
];

function sanitizeTag(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface NamingPanelProps {
  showNext?: boolean;
  onNext?: () => void;
  scroll?: boolean;
}

interface SortableCardProps {
  sec: (typeof SECTIONS)[number];
  isOn: boolean;
  tags: string[];
  isOpen: boolean;
  onToggle: () => void;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

function SortableCard({ sec, isOn, tags, isOpen, onToggle, onOpenDrawer, onCloseDrawer }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // Drawer local state (mirrors SectionEditPopup)
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
    sec.isSingle ? namingNamespaceFromStore : (namingValuesFromStore[sec.key] ?? [])
  );
  const [localDesc, setLocalDesc] = useState(namingDescriptions[sec.key] ?? '');
  const [inputVal, setInputVal] = useState('');
  const [showToast, setShowToast] = useState(false);

  const openDrawer = () => {
    setLocalEdit(sec.isSingle ? namingNamespaceFromStore : (namingValuesFromStore[sec.key] ?? []));
    setLocalDesc(namingDescriptions[sec.key] ?? '');
    setInputVal('');
    onOpenDrawer();
  };

  const handleSave = () => {
    if (sec.isSingle) {
      setNamingNamespace(localEdit as string);
    } else {
      setNamingValue(sec.key, (localEdit as string[]) ?? namingValuesFromStore[sec.key] ?? []);
    }
    if (localDesc !== namingDescriptions[sec.key]) {
      setNamingDescription(sec.key, localDesc);
    }
    onCloseDrawer();
  };

  const handleReset = () => {
    const defaults = useColorStore.getState();
    if (sec.key === 'namespace') {
      setLocalEdit(defaults.defaultNamingNamespace);
    } else {
      setLocalEdit([...(defaults.defaultNamingValues[sec.key] ?? [])]);
    }
    setLocalDesc(defaults.defaultNamingDescriptions[sec.key] ?? '');
  };

  const handleSetAsDefault = () => {
    if (sec.isSingle) {
      setNamingNamespace(localEdit as string);
      setDefaultNamingNamespace(localEdit as string);
    } else {
      setNamingValue(sec.key, (localEdit as string[]) ?? []);
      setDefaultNamingValues(sec.key, (localEdit as string[]) ?? []);
    }
    setNamingDescription(sec.key, localDesc);
    setDefaultNamingDescriptions(sec.key, localDesc);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleAddTag = () => {
    if (sec.isSingle) return;
    const val = sanitizeTag(inputVal);
    if (!val) return;
    const list = (localEdit as string[]) ?? [];
    if (list.includes(val)) return;
    setLocalEdit([...list, val]);
    setInputVal('');
  };

  const handleRemoveTag = (tag: string) => {
    if (sec.isSingle) return;
    const list = (localEdit as string[]) ?? [];
    setLocalEdit(list.filter(v => v !== tag));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border-b border-[#dddddf] flex flex-col"
      {...attributes}
      {...listeners}
    >
      {/* Card header */}
      <div className="pt-[8px] px-5 pb-[2px] cursor-grab active:cursor-grabbing flex flex-col">
        {/* Header: Label + Toggle */}
        <div className="flex items-center justify-between mb-[-6px]">
          <h3 className={`font-bold text-[15px] text-[#333] transition-opacity ${!isOn ? 'opacity-30' : ''}`}>{sec.label}</h3>
          <button
            type="button"
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={e => { e.stopPropagation(); onToggle(); }}
            className="flex items-center justify-center translate-y-[10px]"
            aria-label={isOn ? 'Disable' : 'Enable'}
          >
            <div className="relative w-5 h-8 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-switch2-on.svg"  alt="" width={20} height={32} aria-hidden="true" className={`block w-5 h-8 transition-opacity duration-300 ${isOn ? 'opacity-100' : 'opacity-0'}`} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-switch2-off.svg" alt="" width={20} height={32} aria-hidden="true" className={`block w-5 h-8 absolute top-0 left-0 transition-opacity duration-300 ${isOn ? 'opacity-0' : 'opacity-100'}`} />
            </div>
          </button>
        </div>

        {/* Content */}
        <div className={`flex flex-col flex-1 transition-opacity ${!isOn ? 'opacity-30' : ''}`}>
          <p className="text-[12px] text-[#999] mb-[14px] leading-relaxed">{sec.desc}</p>

          {/* Tags — shared area, click to open drawer */}
          <div
            className="flex flex-wrap gap-[6px] pb-[18px]"
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={e => { e.stopPropagation(); if (!isOpen) openDrawer(); }}
          >
            {(isOpen ? (sec.isSingle ? (localEdit ? [localEdit as string] : []) : (localEdit as string[])) : tags).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-3 h-[28px] bg-[#333] text-[12px] font-medium text-[#fff] rounded-[8px] cursor-pointer">
                {tag}
                {isOpen && !sec.isSingle && (
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); handleRemoveTag(tag); }}
                    className="text-[10px] text-[#aaa] hover:text-[#fff] leading-none"
                  >✕</button>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="bg-white px-5 pt-0 pb-[30px] space-y-4 relative">
            {/* Input row */}
            {sec.isSingle ? (
              <input
                type="text"
                value={localEdit as string}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onChange={e => setLocalEdit(e.target.value)}
                className="w-full h-9 border border-[#dddddd] rounded-[10px] px-3 text-[13px] font-normal text-[#333] outline-none focus:border-[#808088] bg-white"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="값 추가"
                  className="flex-1 h-9 border border-[#dddddd] rounded-[10px] px-3 text-[13px] font-normal text-[#333] outline-none focus:border-[#808088] bg-white"
                />
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); handleAddTag(); }}
                  className="h-9 px-4 bg-[#666] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#555] transition-colors"
                >추가</button>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5 text-[#333]">설명</label>
              <input
                type="text"
                value={localDesc}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onChange={e => setLocalDesc(e.target.value)}
                placeholder="이 섹션의 설명을 입력하세요"
                className="w-full h-9 border border-[#dddddd] rounded-[10px] px-3 text-[13px] font-normal text-[#333] outline-none focus:border-[#808088] bg-white"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); handleReset(); }}
                  className="h-9 px-4 bg-white border border-[#e0e0e0] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#f5f5f5] transition-colors"
                >Reset</button>
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); handleSetAsDefault(); }}
                  className="h-9 px-4 bg-[#e8eeff] rounded-[10px] text-[13px] font-medium text-[#4a7cf5] hover:bg-[#d8e4ff] transition-colors"
                >Set Default</button>
              </div>
              <div className="flex gap-2">
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onCloseDrawer(); }}
                  className="w-[90px] h-9 bg-white border border-[#e0e0e0] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#f5f5f5] transition-colors"
                >Cancel</button>
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); handleSave(); }}
                  className="w-[90px] h-9 bg-[#666] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#555] transition-colors"
                >Save</button>
              </div>
            </div>

            {/* Toast */}
            {showToast && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#333] text-white rounded-lg text-sm z-10">
                기본값으로 설정되었습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NamingPanel({ showNext, onNext, scroll = true }: NamingPanelProps) {
  const namingNamespace    = useColorStore(s => s.namingNamespace);
  const namingOrder        = useColorStore(s => s.namingOrder);
  const namingEnabled      = useColorStore(s => s.namingEnabled);
  const namingValues       = useColorStore(s => s.namingValues);
  const setNamingOrder     = useColorStore(s => s.setNamingOrder);
  const setNamingEnabled   = useColorStore(s => s.setNamingEnabled);

  const [openKey, setOpenKey] = useState<SectionKey | null>(null);
  const [toast, setToast] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 1 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = namingOrder.indexOf(active.id as SectionKey);
      const newIndex = namingOrder.indexOf(over.id as SectionKey);
      setNamingOrder(arrayMove(namingOrder, oldIndex, newIndex));
    }
  };

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const toggleEnabled = (key: SectionKey) => {
    const next = new Set(namingEnabled);
    if (next.has(key)) {
      if (next.size <= 1) { showToast(); return; }
      next.delete(key);
    } else {
      next.add(key);
    }
    setNamingEnabled([...next]);
  };

  const previewStr = namingOrder
    .filter(k => namingEnabled.includes(k))
    .map(k => k === 'namespace' ? (namingNamespace || 'ns') : ((namingValues[k] ?? [])[0] ?? k))
    .join('.');

  const sortedSections = [...SECTIONS].sort(
    (a, b) => namingOrder.indexOf(a.key) - namingOrder.indexOf(b.key)
  );

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 z-[9999] bg-[#333] text-white text-[12px] font-medium px-4 py-2 rounded-[10px] shadow-lg whitespace-nowrap pointer-events-none">
          최소 1개 이상의 네이밍 그룹이 필요합니다.
        </div>
      )}

      {/* Preview row */}
      <div className="flex items-center justify-between shrink-0 h-[40px] bg-white border-b border-[#dddddf] px-[15px]">
        <span className="font-semibold text-[13px] text-[#999]">Form</span>
        <span className="text-[13px] text-[#333] font-mono truncate ml-4 text-right">{previewStr || '—'}</span>
      </div>

      {/* Card list */}
      <div className={`flex-1 ${scroll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedSections.map(s => s.key)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0">
              {sortedSections.map(sec => {
                const isOn = namingEnabled.includes(sec.key);
                const tags = sec.isSingle
                  ? (namingNamespace ? [namingNamespace] : [])
                  : (namingValues[sec.key] ?? []);
                return (
                  <SortableCard
                    key={sec.key}
                    sec={sec}
                    isOn={isOn}
                    tags={tags}
                    isOpen={openKey === sec.key}
                    onToggle={() => toggleEnabled(sec.key)}
                    onOpenDrawer={() => setOpenKey(sec.key)}
                    onCloseDrawer={() => setOpenKey(null)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {showNext && onNext && (
          <div className="p-3 flex justify-center mt-[30px]">
            <button
              type="button"
              className="w-[90px] h-[90px] bg-white text-[#999] border-2 border-[#999] rounded-full flex items-center justify-center mx-auto whitespace-nowrap"
              onClick={onNext}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
