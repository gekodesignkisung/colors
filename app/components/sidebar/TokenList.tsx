'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { TokenGroup } from '@/types/tokens';
import TokenCard from './TokenCard';

const GROUP_ORDER: TokenGroup[] = [
  'Primary', 'Secondary', 'Tertiary', 'Background', 'Surface', 'Outline', 'Error',
];

export default function TokenList() {
  const tokens = useColorStore(s => s.tokens);
  const { isDark, toggleDark } = useColorStore();
  const [collapsed, setCollapsed] = useState<Set<TokenGroup>>(new Set());

  const grouped = GROUP_ORDER.map(group => ({
    group,
    tokens: tokens.filter(t => t.group === group),
  }));

  const toggle = (group: TokenGroup) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — #808088, 56px */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#808088] px-[15px]">
        <span className="text-white font-semibold text-base">Generated Colors</span>

        {/* Light / Dark mode toggle */}
        <div className="flex items-center h-9 rounded-lg overflow-hidden bg-black/20">
          <button
            type="button"
            title="라이트 모드"
            aria-label="라이트 모드"
            aria-pressed={!isDark ? 'true' : 'false'}
            onClick={() => { if (isDark) toggleDark(); }}
            className={`flex items-center justify-center w-8 h-9 transition-colors ${!isDark ? 'bg-white/20' : ''}`}
          >
            {/* Sun */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            type="button"
            title="다크 모드"
            aria-label="다크 모드"
            aria-pressed={isDark ? 'true' : 'false'}
            onClick={() => { if (!isDark) toggleDark(); }}
            className={`flex items-center justify-center w-8 h-9 transition-colors ${isDark ? 'bg-white/20' : ''}`}
          >
            {/* Moon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M10 7A5 5 0 014 1a5 5 0 100 10 5 5 0 006-4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {grouped.map(({ group, tokens: groupTokens }) => {
          if (groupTokens.length === 0) return null;
          const isCollapsed = collapsed.has(group);

          return (
            <div key={group}>
              {/* Group header — 60px */}
              <button
                type="button"
                onClick={() => toggle(group)}
                className="w-full flex items-center justify-between h-[60px] px-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-[#333333]">{group}</span>
                  <svg
                    width="6" height="4" viewBox="0 0 6 4" fill="none"
                    className={`transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M0.5 0.5L3 3L5.5 0.5" stroke="#777777" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[13px] text-[#777777]">{groupTokens.length}</span>
                </div>

                {/* Color swatches (up to 4) */}
                <div className="flex items-center gap-1">
                  {groupTokens.slice(0, 4).map(t => (
                    <div
                      key={t.id}
                      className="w-4 h-4 rounded-full border border-black/[0.08]"
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </div>
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
