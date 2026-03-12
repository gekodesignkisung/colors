'use client';

import React from 'react';
import { SectionKey } from './Step3GenerateTokensScreen';

interface Step3TokenPanelProps {
  tokenName: string;
  previewColor: string;
  enabled: SectionKey[];
  toggleEnabled: (key: SectionKey) => void;
  namespace: string;
  setNamespace: (val: string) => void;
  theme: (typeof THEME_OPTIONS)[number];
  setTheme: (val: typeof THEME_OPTIONS[number]) => void;
  newTokenName: string;
  setNewTokenName: (val: string) => void;
  handleAddToken: () => void;
  description: string;
  setDescription: (val: string) => void;
  resetAll: () => void;
  saveToken: () => void;
  showToast: boolean;
  setShowToast: (val: boolean) => void;
  options: Record<Exclude<SectionKey, 'namespace' | 'theme'>, string[]>;
  selected: Record<string, string>;
  setPick: (key: Exclude<SectionKey, 'namespace' | 'theme'>, value: string) => void;
}

const THEME_OPTIONS = ['light', 'dark', 'high-contrast'] as const;

export default function Step3TokenPanel({
  tokenName,
  previewColor,
  enabled,
  toggleEnabled,
  namespace,
  setNamespace,
  theme,
  setTheme,
  newTokenName,
  setNewTokenName,
  handleAddToken,
  description,
  setDescription,
  resetAll,
  saveToken,
  showToast,
  setShowToast,
  options,
  selected,
  setPick,
}: Step3TokenPanelProps) {
  return (
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
              onChange={e => setNamespace(e.target.value)}
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
                className="flex-1 h-[32px] border border-[#ccc] rounded-[8px] px-[3px] text-[12px] text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
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
              className="mt-3 w-full h-[32px] border border-[#ccc] rounded-[8px] px-[3px] text-[12px] text-[#333] outline-none focus:border-[#808088] placeholder-[#ccc]"
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
      </div>
    </div>
  );
}
