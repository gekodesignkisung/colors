'use client';

import { useEffect, useMemo, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { computeNamingTokenColor } from '@/lib/generateTokens';

type SectionKey =
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
          <div className="w-[400px] h-full bg-white border shadow-md rounded-xl overflow-hidden shadow-[0px_4px_24px_rgba(0,0,0,0.08)]">
            <div className="relative flex flex-col h-full bg-white overflow-hidden">
              {/* Preview row */}
              <div className="flex flex-col items-center justify-center shrink-0 h-[60px] bg-white border-b border-[#dddddf] px-[15px]">
                <div className="text-[13px] text-[#333] font-mono truncate w-full text-center">
                  {tokenName || '—'}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-[14px] h-[14px] rounded-full border border-[#ddd]" style={{ background: previewColor }} />
                  <div className="text-[11px] text-[#999] font-mono">{previewColor}</div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {/* Namespace */}
                <div className="border-b border-[#dddddf] px-[15px] py-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#333]">Namespace</div>
                      <div className="text-[12px] font-medium text-[#999]">전체 토큰을 구분하는 최상위 식별자</div>
                    </div>
                    <img
                      src={enabled.includes('namespace') ? '/icon-switch2-on.svg' : '/icon-switch2-off.svg'}
                      alt=""
                      width={24}
                      height={40}
                      aria-hidden="true"
                      onClick={() => toggleEnabled('namespace')}
                      className="shrink-0 cursor-pointer mt-1"
                    />
                  </div>
                  <input
                    type="text"
                    value={namespace}
                    onChange={e => setNamespace(sanitizeTag(e.target.value))}
                    placeholder="e.g. color"
                    className="mt-3 w-full h-[32px] border border-[#ccc] rounded-[8px] px-3 text-[13px] font-mono text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
                  />
                </div>

                {/* Theme */}
                <div className="border-b border-[#dddddf] px-[15px] py-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#333]">Theme</div>
                      <div className="text-[12px] font-medium text-[#999]">CSS scope로 처리 (토큰명에 포함 안 됨)</div>
                    </div>
                    <img
                      src={enabled.includes('theme') ? '/icon-switch2-on.svg' : '/icon-switch2-off.svg'}
                      alt=""
                      width={24}
                      height={40}
                      aria-hidden="true"
                      onClick={() => toggleEnabled('theme')}
                      className="shrink-0 cursor-pointer mt-1"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-[6px]">
                    {THEME_OPTIONS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`inline-flex items-center h-[26px] px-[10px] rounded-[50px] text-[12px] font-semibold transition-colors
                          ${theme === t ? 'bg-[#606070] text-white' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add new token */}
                <div className="border-b border-[#dddddf] px-[15px] py-[12px]">
                  <div className="font-semibold text-sm text-[#333]">Add new token</div>
                  <div className="mt-3 flex items-center gap-[6px]">
                    <input
                      type="text"
                      value={newTokenName}
                      onChange={e => setNewTokenName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddToken();
                      }}
                      placeholder="New token name"
                      className="flex-1 h-[32px] border border-[#ccc] rounded-[8px] px-3 text-[12px] text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
                    />
                    <button
                      type="button"
                      onClick={handleAddToken}
                      className="shrink-0 w-[32px] h-[32px] flex items-center justify-center hover:opacity-70 transition-opacity"
                      aria-label="추가"
                    >
                      <img src="/icon-add-item.svg" alt="" width={30} height={30} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="border-b border-[#dddddf] px-[15px] py-[12px]">
                  <div className="font-semibold text-sm text-[#333]">Description</div>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="토큰의 의도를 간단히 적어주세요"
                    className="mt-3 w-full h-[32px] border border-[#ccc] rounded-[8px] px-3 text-[12px] text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
                  />

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={resetAll}
                        className="h-[30px] px-3 bg-[#f5f5f5] rounded-[8px] text-[12.5px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowToast(true)}
                        className="h-[30px] px-3 bg-[#eef5ff] rounded-[8px] text-[12.5px] font-medium text-[#4a70e2] hover:bg-[#ddeaff] transition-colors"
                      >
                        Set default
                      </button>
                    </div>
                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={() => {
                          setDescription('');
                          setNewTokenName('');
                        }}
                        className="h-[30px] w-[70px] bg-[#f5f5f5] rounded-[8px] text-[12.5px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveToken}
                        className="h-[30px] w-[70px] bg-[#666] rounded-[8px] text-[12.5px] font-medium text-white hover:bg-[#555] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Picker rows */}
                {(Object.keys(options) as Array<Exclude<SectionKey, 'namespace' | 'theme'>>).map(key => (
                  <div key={key} className="border-b border-[#dddddf] px-[15px] py-[12px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#333]">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                        <div className="text-[12px] font-medium text-[#999]">
                          {key === 'category'
                            ? '토큰의 속성 유형 (color, typography...)'
                            : key === 'component'
                              ? '적용될 컴포넌트 (button, input...)'
                              : key === 'type'
                                ? '컬러 적용 대상 (background, text, border...)'
                                : key === 'variant'
                                  ? '색상 역할 (primary, secondary...)'
                                  : key === 'state'
                                    ? 'UI 인터랙션 상태 (default, hover...)'
                                    : key === 'element'
                                      ? '세부 요소 (container 등)'
                                      : '사이즈 (small, medium...)'}
                        </div>
                      </div>
                      <img
                        src={enabled.includes(key) ? '/icon-switch2-on.svg' : '/icon-switch2-off.svg'}
                        alt=""
                        width={24}
                        height={40}
                        aria-hidden="true"
                        onClick={() => toggleEnabled(key)}
                        className="shrink-0 cursor-pointer mt-1"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-[6px]">
                      {options[key].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPick(key, v)}
                          className={`inline-flex items-center h-[26px] px-[10px] rounded-[50px] text-[12px] font-semibold transition-colors
                            ${selected[key] === v ? 'bg-[#606070] text-white' : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Toast */}
              {showToast && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[70]">
                  <div className="bg-[#333] text-white px-4 py-2 rounded-lg shadow-lg text-[12px] font-medium whitespace-nowrap">
                    저장되었습니다.
                  </div>
                </div>
              )}
            </div>
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
  );
}

