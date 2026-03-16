'use client';

import { useEffect, useMemo, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { computeNamingTokenColor } from '@/lib/generateTokens';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SectionEditPopup from './SectionEditPopup';

export type SectionKey =
  | 'namespace'
  | 'theme'
  | 'category'
  | 'component'
  | 'type'
  | 'variant'
  | 'element'
  | 'state'
  | 'size';

export type PanelSectionKey =
  | 'namespace' | 'theme' | 'category' | 'component'
  | 'type' | 'variant' | 'state';

const DEFAULT_STEP3_VALUES: Record<Exclude<SectionKey, 'namespace' | 'theme'>, string[]> = {
  category: ['color'],
  component: ['button', 'input', 'card'],
  type: ['background', 'text', 'border'],
  variant: ['primary', 'secondary', 'tertiary', 'danger'],
  element: ['container'],
  state: ['default', 'hover', 'pressed', 'disabled'],
  size: ['medium'],
};

const THEME_OPTIONS = ['light', 'dark', 'high-contrast'] as const;

const PANEL_SECTIONS: { key: PanelSectionKey; label: string; desc: string; isSingle?: boolean }[] = [
  { key: 'namespace', label: 'Namespace', desc: '전체 토큰을 구분하는 최상위 식별자',              isSingle: true },
  { key: 'theme',     label: 'Theme',     desc: 'CSS scope로 처리 (토큰명에 포함 안 됨)' },
  { key: 'category',  label: 'Category',  desc: '토큰의 속성 유형 (color, typography..)' },
  { key: 'variant',   label: 'Variant',   desc: '색상 역할' },
  { key: 'type',      label: 'Type',      desc: '컬러 적용 대상' },
  { key: 'state',     label: 'State',     desc: 'UI 인터랙션 상태' },
  { key: 'component', label: 'Component', desc: '2단계 alias 레이어에 적용' },
];

function sanitizeTag(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function Step3GenerateTokensScreen({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  // Main screen states
  const baseColors = useColorStore(s => s.baseColors);
  const isDark = useColorStore(s => s.isDark);
  const useOklch = useColorStore(s => s.useOklch);
  const namingNamespace = useColorStore(s => s.namingNamespace);
  const namingValues = useColorStore(s => s.namingValues);
  const addCustomToken = useColorStore(s => s.addCustomToken);

  const [enabled, setEnabled] = useState<SectionKey[]>([
    'namespace',
    'category',
    'component',
    'type',
    'variant',
    'state',
  ]);

  const [namespace, setNamespace] = useState<string>('color');
  const [theme, setTheme] = useState<(typeof THEME_OPTIONS)[number]>('light');

  const [selected, setSelected] = useState<Record<string, string>>({
    category: 'color',
    component: 'button',
    type: 'background',
    variant: 'primary',
    element: 'container',
    state: 'default',
    size: 'medium',
  });

  const [newTokenName, setNewTokenName] = useState('');
  const [description, setDescription] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Panel states
  const namingNamespaceFromStore = useColorStore(s => s.namingNamespace);
  const namingOrder = useColorStore(s => s.namingOrder);
  const namingEnabled = useColorStore(s => s.namingEnabled);
  const namingValuesFromStore = useColorStore(s => s.namingValues);
  const namingDescriptions = useColorStore(s => s.namingDescriptions);

  const setNamingNamespace = useColorStore(s => s.setNamingNamespace);
  const setNamingOrder = useColorStore(s => s.setNamingOrder);
  const setNamingEnabled = useColorStore(s => s.setNamingEnabled);

  const [editingKey, setEditingKey] = useState<PanelSectionKey | null>(null);
  const [editingPos, setEditingPos] = useState<{ x: number; y: number } | null>(null);

  // Main screen effects
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // hydrate default namespace with naming namespace if present
  useEffect(() => {
    if (namingNamespace && namespace === 'color') {
      // keep the figma-like "color" default unless user already changed it,
      // but if naming namespace exists, prefilling helps.
      // no-op: user requested figma spec; keeping "color" matches screenshot.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(() => {
    // prefer NamingPanel-configured options where relevant
    const o = { ...DEFAULT_STEP3_VALUES };
    if (Array.isArray(namingValues.category) && namingValues.category.length) o.category = namingValues.category;
    if (Array.isArray(namingValues.component) && namingValues.component.length) o.component = namingValues.component;
    if (Array.isArray(namingValues.type) && namingValues.type.length) o.type = namingValues.type;
    if (Array.isArray(namingValues.variant) && namingValues.variant.length) o.variant = namingValues.variant;
    if (Array.isArray(namingValues.state) && namingValues.state.length) o.state = namingValues.state;
    return o;
  }, [namingValues]);

  const tokenName = useMemo(() => {
    const parts: string[] = [];
    const push = (key: SectionKey, value?: string) => {
      if (!enabled.includes(key)) return;
      const v = value ?? (key === 'namespace' ? namespace : selected[key]);
      if (v) parts.push(v);
    };
    push('namespace');
    push('category');
    push('component');
    push('type');
    push('variant');
    push('state');
    push('element');
    push('size');
    return parts.filter(Boolean).join('.');
  }, [enabled, namespace, selected]);

  const previewColor = useMemo(() => {
    const variant = selected.variant ?? 'primary';
    const state = selected.state ?? 'default';
    const type = selected.type ?? 'background';
    return computeNamingTokenColor(variant, state, type, baseColors, isDark, useOklch);
  }, [selected.variant, selected.state, selected.type, baseColors, isDark, useOklch]);

  const toggleEnabled = (key: SectionKey) => {
    setEnabled(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const setPick = (key: Exclude<SectionKey, 'namespace' | 'theme'>, value: string) => {
    setSelected(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToken = () => {
    const raw = newTokenName.trim();
    const sanitized = sanitizeTag(raw);
    if (!sanitized) return;
    setPick('component', sanitized);
    setNewTokenName('');
  };

  const resetAll = () => {
    setEnabled(['namespace', 'category', 'component', 'type', 'variant', 'state']);
    setNamespace('color');
    setTheme('light');
    setSelected({
      category: 'color',
      component: 'button',
      type: 'background',
      variant: 'primary',
      element: 'container',
      state: 'default',
      size: 'medium',
    });
    setNewTokenName('');
    setDescription('');
  };

  const saveToken = () => {
    addCustomToken({
      id: tokenName,
      name: tokenName,
      group: selected.variant || 'primary',
      color: previewColor,
      rule: {
        operation: 'source',
        source: selected.variant || 'primary',
        param: undefined,
        description: description ?? '',
        namingVariant: selected.variant,
        namingState: selected.state,
        namingType: selected.type,
      },
      isManual: true,
    });
    setShowToast(true);
  };

  // Panel helpers
  const panelPreviewStr = namingOrder
    .filter(k => namingEnabled.includes(k))
    .map(k => k === 'namespace' ? (namingNamespaceFromStore || 'ns') : ((namingValuesFromStore[k] ?? [])[0] ?? k))
    .join('.');

  const panelToggleEnabled = (key: PanelSectionKey, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(namingEnabled);
    next.has(key) ? next.delete(key) : next.add(key);
    setNamingEnabled([...next]);
  };

  // Drag and drop handler
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 1 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = namingOrder.indexOf(active.id as PanelSectionKey);
      const newIndex = namingOrder.indexOf(over.id as PanelSectionKey);
      if (oldIndex !== -1 && newIndex !== -1) {
        setNamingOrder(arrayMove(namingOrder, oldIndex, newIndex));
      }
    }
  };

  const sortedSections = [...PANEL_SECTIONS].sort((a, b) =>
    namingOrder.indexOf(a.key) - namingOrder.indexOf(b.key)
  );

  return (
    <div className="flex w-full flex-col bg-white overflow-hidden items-center pt-[80px]">
      <div className="flex flex-col w-[1080px] max-w-full h-full">
        <div className="flex w-full items-baseline justify-between pb-2">
          <h1
            className="text-[#333]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '29.05px' }}
          >
            Step 3. Configuring Token Naming Rules
          </h1>
          <div className="flex items-center w-[120px] h-[50px]">
            <img src="/logo-opencolor-s.svg" alt="OpenColor" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>

        <div className="w-full h-[2px] bg-[#404050]" />

        <div className="pt-3 mb-6">
          <p className="text-[#808090]" style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, lineHeight: '25.2px' }}>
            This step allows you to set the names and intentions of your color tokens and combine them. You can modify or add tokens based on key color information and various purposes or design intentions. These various settings can be changed at any time later.
          </p>
        </div>

        <div className="flex w-full justify-center flex-1 min-h-0 relative pt-[30px] pb-[30px]">
          {/* Panel */}
          <div className="w-full max-w-[1000px] h-full flex flex-col bg-white overflow-hidden">

            {/* Preview row */}
            <div className="flex items-center justify-center shrink-0 h-[60px] mx-6 px-[15px] bg-[#f5f5f5] rounded-[20px]">
              <span className="text-[20px] text-[#333] font-semibold font-mono truncate">{panelPreviewStr || '—'}</span>
            </div>

            {/* Card Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                <SortableContext items={sortedSections.map(s => s.key)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 gap-4">
                    {sortedSections.map(sec => (
                      <SortableCard
                        key={sec.key}
                        sec={sec}
                        isOn={namingEnabled.includes(sec.key)}
                        onEdit={(e) => { setEditingKey(sec.key); setEditingPos({ x: e.clientX, y: e.clientY }); }}
                        onToggle={(e) => panelToggleEnabled(sec.key, e)}
                        namingNamespaceFromStore={namingNamespaceFromStore}
                        namingValuesFromStore={namingValuesFromStore}
                        namingDescriptions={namingDescriptions}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Bottom Nav Area */}
        <div className="flex flex-col w-[1080px] max-w-full justify-end pb-[60px] pt-[20px]">
          <div className="flex items-center w-full h-[50px]">
            <button
              className="flex items-center justify-center w-[120px] h-full rounded-[50px] border-[2px] border-[#404050] bg-white text-[#404050] transition-colors hover:bg-gray-50 cursor-pointer"
              onClick={onPrev}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 18, lineHeight: '21.78px' }}>
                Prev.
              </span>
            </button>
            <div className="h-[2px] bg-[#404050] flex-1 mx-0" />
            <button
              className="flex items-center justify-center w-[120px] h-full rounded-[50px] transition-colors bg-[#404050] text-white cursor-pointer"
              onClick={onNext}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 18, lineHeight: '21.78px' }}>
                Next
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Popup */}
      {editingKey && (
        <SectionEditPopup
          sectionKey={editingKey}
          label={PANEL_SECTIONS.find(s => s.key === editingKey)?.label || ''}
          isSingle={PANEL_SECTIONS.find(s => s.key === editingKey)?.isSingle}
          onClose={() => setEditingKey(null)}
          anchorPos={editingPos ?? undefined}
        />
      )}
    </div>
  );
}

// Sortable Card Component
function SortableCard({
  sec,
  isOn,
  onEdit,
  onToggle,
  namingNamespaceFromStore,
  namingValuesFromStore,
  namingDescriptions,
}: {
  sec: (typeof PANEL_SECTIONS)[number];
  isOn: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onToggle: (e: React.MouseEvent) => void;
  namingNamespaceFromStore: string;
  namingValuesFromStore: Record<string, string[]>;
  namingDescriptions: Record<string, string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : (transition || 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'),
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const values = sec.isSingle
    ? [namingNamespaceFromStore]
    : (namingValuesFromStore[sec.key] ?? []);

  const displayValues = values;
  const remainingCount = 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-[#aaa] rounded-2xl pt-[6px] px-4 pb-3 bg-white cursor-grab active:cursor-grabbing transition-all flex flex-col min-h-[160px] shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
      {...attributes}
      {...listeners}
    >
      {/* Header: Label + Toggle */}
      <div className="flex items-center justify-between mb-[-6px]">
        <h3 className={`font-bold text-[15px] text-[#333] transition-opacity ${!isOn ? 'opacity-30' : ''}`}>{sec.label}</h3>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(e);
          }}
          className="flex items-center justify-center translate-y-[10px]"
          aria-label={isOn ? 'Disable' : 'Enable'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isOn ? '/icon-switch2-on.svg' : '/icon-switch2-off.svg'}
            alt=""
            width={20}
            height={32}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Content (dimmed when off) */}
      <div className={`flex flex-col flex-1 transition-opacity ${!isOn ? 'opacity-30' : ''}`}>
      {/* Description */}
      <p className="text-[12px] text-[#999] mb-[14px] leading-relaxed">
        {namingDescriptions[sec.key] || sec.desc}
      </p>

      {/* Values — click to edit */}
      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}
        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
        onClick={e => { e.stopPropagation(); onEdit(e); }}
        title="Edit Token"
        className="flex flex-wrap gap-[6px] mb-2 text-left cursor-pointer"
      >
        {displayValues.map(val => (
          <span
            key={val}
            className="inline-flex items-center px-3 h-[28px] bg-[#333] text-[12px] font-medium text-[#fff] rounded-[8px]"
          >
            {val}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-3 h-[28px] bg-[#f5f5f5] text-[12px] font-medium text-[#999] rounded-[8px]">
            +{remainingCount}
          </span>
        )}
      </button>
      </div>
    </div>
  );
}
