'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import TokenCard from './TokenCard';

export default function TokenList() {
  const tokens = useColorStore(s => s.tokens);
  const { isDark, toggleDark } = useColorStore();

  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const t = useColorStore.getState().tokens;
    return t.length > 0 ? t[0].group : null;
  });

  // Group tokens by their `group` field (= variant name)
  const groups = [...new Set(tokens.map(t => t.group))];

  const toggle = (group: string) =>
    setOpenGroup(prev => (prev === group ? null : group));

  const displayLabel = (group: string) =>
    group.charAt(0).toUpperCase() + group.slice(1);

  return (
    <div className="flex flex-col h-full">
      {/* Header — Figma node 24:3 */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#808090] px-[15px] gap-5">
        <span className="font-semibold text-[16px] text-white">Generated Colors</span>

        {/* Light / Dark mode toggle — Figma node 45:158 */}
        <div className="flex items-center gap-0">
          <button
            type="button"
            title="라이트 모드"
            aria-label="라이트 모드"
            aria-pressed={!isDark}
            onClick={() => { if (isDark) toggleDark(); }}
            className={`flex items-center justify-center w-8 h-9 px-[4px] transition-colors ${!isDark ? 'border-b-2 border-white' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-lightmode.svg" alt="" width={24} height={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="다크 모드"
            aria-label="다크 모드"
            aria-pressed={isDark}
            onClick={() => { if (!isDark) toggleDark(); }}
            className={`flex items-center justify-center w-8 h-9 px-[4px] transition-colors ${isDark ? 'border-b-2 border-white' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-darkmode.svg" alt="" width={24} height={24} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tokens count row */}
      <div className="flex items-center justify-between shrink-0 h-[40px] bg-[#f5f5f5] border-b border-[#dddddf] px-[15px]">
        <span className="font-semibold text-[13px] text-[#999]">Tokens</span>
        <span className="text-[13px] text-[#333] font-mono">{tokens.length}</span>
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => {
          const groupTokens = tokens.filter(t => t.group === group);
          if (groupTokens.length === 0) return null;
          const isCollapsed = openGroup !== group;

          return (
            <div key={group}>
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggle(group)}
                className="w-full flex items-center justify-between h-[60px] px-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Icon-bullet-dn.svg"
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-200 ${!isCollapsed ? 'rotate-180' : ''}`}
                  />
                  <span className="font-semibold text-sm text-[#333]">{displayLabel(group)}</span>
                </div>

                <span className="text-[12px] text-[#999]">{groupTokens.length}</span>
              </button>

              {/* Token cards */}
              {!isCollapsed && groupTokens.map(token => (
                <TokenCard key={token.id} token={token} />
              ))}

              {/* Divider */}
              <div className="h-px bg-[#f0f0f0]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
