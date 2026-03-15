'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SectionEditPopup, { PanelSectionKey } from '@/app/components/onboarding/SectionEditPopup';

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

interface NamingPanelProps {
  showNext?: boolean;
  onNext?: () => void;
  scroll?: boolean;
}

interface SortableCardProps {
  sec: (typeof SECTIONS)[number];
  isOn: boolean;
  tags: string[];
  onToggle: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

function SortableCard({ sec, isOn, tags, onToggle, onEdit }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="pt-[8px] px-5 pb-[2px] bg-white cursor-grab active:cursor-grabbing transition-all flex flex-col border-b border-[#dddddf]"
      {...attributes}
      {...listeners}
    >
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

        {/* Tags — click to edit */}
        <button
          type="button"
          onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
          onClick={e => { e.stopPropagation(); onEdit(e); }}
          title="Edit Token"
          className="flex flex-wrap gap-[6px] pb-[18px] text-left cursor-pointer"
        >
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-3 h-[28px] bg-[#333] text-[12px] font-medium text-[#fff] rounded-[8px]">
              {tag}
            </span>
          ))}
        </button>
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

  const [editingKey, setEditingKey] = useState<SectionKey | null>(null);
  const [editingPos, setEditingPos] = useState<{ x: number; y: number } | null>(null);

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

  const toggleEnabled = (key: SectionKey) => {
    const next = new Set(namingEnabled);
    next.has(key) ? next.delete(key) : next.add(key);
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

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-[56px] bg-[#606070] px-[15px]">
        <span className="font-semibold text-[16px] text-white">Token Naming Rules</span>
      </div>

      {/* Preview row */}
      <div className="flex items-center justify-between shrink-0 h-[40px] bg-[#f5f5f5] border-b border-[#dddddf] px-[15px]">
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
                    onToggle={() => toggleEnabled(sec.key)}
                    onEdit={(e) => { setEditingKey(sec.key); setEditingPos({ x: e.clientX, y: e.clientY }); }}
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

      {/* Section edit popup */}
      {editingKey && (() => {
        const sec = SECTIONS.find(s => s.key === editingKey)!;
        return (
          <SectionEditPopup
            sectionKey={editingKey}
            label={sec.label}
            isSingle={sec.isSingle}
            onClose={() => setEditingKey(null)}
            anchorPos={editingPos ?? undefined}
          />
        );
      })()}
    </div>
  );
}
