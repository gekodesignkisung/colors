'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import TokenCard from './TokenCard';
import { ColorShape } from '@/app/components/ColorShape';

const NEUTRAL_DERIVED = ['background', 'surface', 'outline'];
const FIXED_GROUPS = ['error'];
const NEUTRAL_DERIVED_LABELS: Record<string, string> = {
  background: 'Background',
  surface: 'Surface',
  outline: 'Outline',
  error: 'Error',
};

export default function TokenList() {
  const tokens = useColorStore(s => s.tokens);
  const { isDark, toggleDark, groupOrder, groupLabels } = useColorStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Build display order: base groups (non-neutral) → neutral-derived → error → extra custom groups
  const allTokenGroups = [...new Set(tokens.map(t => t.group))];
  const baseGroupsInOrder = groupOrder.filter(k => k !== 'neutral' && allTokenGroups.includes(k));
  const neutralDerived = NEUTRAL_DERIVED.filter(k => allTokenGroups.includes(k));
  const fixedGroups = FIXED_GROUPS.filter(k => allTokenGroups.includes(k));
  const knownSet = new Set([...groupOrder, ...NEUTRAL_DERIVED, ...FIXED_GROUPS]);
  const extraGroups = allTokenGroups.filter(k => !knownSet.has(k));
  const orderedGroups = [...baseGroupsInOrder, ...neutralDerived, ...fixedGroups, ...extraGroups];

  const getGroupLabel = (key: string) =>
    groupLabels[key] ?? NEUTRAL_DERIVED_LABELS[key] ?? (key.charAt(0).toUpperCase() + key.slice(1));

  const toggle = (group: string) => {
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M10 7A5 5 0 014 1a5 5 0 100 10 5 5 0 006-4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {orderedGroups.map((group) => {
          const groupTokens = tokens.filter(t => t.group === group);
          if (groupTokens.length === 0) return null;
          const isCollapsed = collapsed.has(group);
          const displayLabel = getGroupLabel(group);

          return (
            <div key={group}>
              {/* Group header — 60px */}
              <button
                type="button"
                onClick={() => toggle(group)}
                className="w-full flex items-center justify-between h-[60px] px-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-[#333333]">{displayLabel}</span>
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
                    <ColorShape key={t.id} color={t.color} size={16} />
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

