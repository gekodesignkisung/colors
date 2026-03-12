'use client';

import { useEffect, useMemo, useState } from 'react';
import Step3TokenPanel from './Step3TokenPanel';
import { useColorStore } from '@/store/colorStore';
import { computeNamingTokenColor } from '@/lib/generateTokens';

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
    // Use "component" as the user's custom token hook, matching screenshot's "Add new token"
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
    // Persist as a custom token that also appears in main TokenList.
    // Theme is treated as scope and is not embedded in the token name (consistent with NamingPanel).
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

  return (
    <div className="flex w-full flex-col bg-white overflow-hidden items-center pt-[80px]">
      <div className="flex flex-col w-[1080px] max-w-full h-full">
        <div className="flex w-full items-center justify-between pb-2">
          <h1
            className="text-[#333]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '29.05px' }}
          >
            Step 3 . Generate Color Tokens
          </h1>
          <div className="flex items-center w-[120px] h-[50px]">
            <img src="/logo-opencolor-s.svg" alt="OpenColor" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>

        <div className="w-full h-[2px] bg-[#404050]" />

        <div className="pt-3 mb-6">
          <p className="text-[#808090]" style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, lineHeight: '25.2px' }}>
            Create and save custom color tokens based on your key colors and naming rules.
          </p>
        </div>

        <div className="flex w-full justify-center flex-1 min-h-0 relative">
          <Step3TokenPanel
            tokenName={tokenName}
            previewColor={previewColor}
            enabled={enabled}
            toggleEnabled={toggleEnabled}
            namespace={namespace}
            setNamespace={setNamespace}
            theme={theme}
            setTheme={setTheme}
            newTokenName={newTokenName}
            setNewTokenName={setNewTokenName}
            handleAddToken={handleAddToken}
            description={description}
            setDescription={setDescription}
            resetAll={resetAll}
            saveToken={saveToken}
            showToast={showToast}
            setShowToast={setShowToast}
            options={options}
            selected={selected}
            setPick={setPick}
          />
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
  </div>
  );
}

