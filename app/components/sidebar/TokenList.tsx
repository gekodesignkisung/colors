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
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#808090] px-[15px]">
        <span className="text-white font-semibold text-base">Generated Colors</span>

        {/* Light / Dark mode toggle */}
        <div className="flex items-center h-9 rounded-lg overflow-hidden bg-black/20">
          <button
            type="button"
            title="라이트 모드"
            aria-label="라이트 모드"
            aria-pressed={!isDark}
            onClick={() => { if (isDark) toggleDark(); }}
            className={`flex items-center justify-center w-8 h-9 transition-colors ${!isDark ? 'bg-white/20' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            type="button"
            title="다크 모드"
            aria-label="다크 모드"
            aria-pressed={isDark}
            onClick={() => { if (!isDark) toggleDark(); }}
            className={`flex items-center justify-center w-8 h-9 transition-colors ${isDark ? 'bg-white/20' : ''}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M10 7A5 5 0 014 1a5 5 0 100 10 5 5 0 006-4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
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
