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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header — matches BaseColorInput header height */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Generated Tokens ({tokens.length})
        </span>
      </div>

    <div className="flex-1 overflow-y-auto py-2">

      {grouped.map(({ group, tokens: groupTokens }) => {
        if (groupTokens.length === 0) return null;
        const isCollapsed = collapsed.has(group);

        return (
          <div key={group} className="mb-1">
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggle(group)}
              className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Mini color strip */}
                <div className="flex gap-0.5">
                  {groupTokens.slice(0, 4).map(t => (
                    <div
                      key={t.id}
                      className="w-2.5 h-2.5 rounded-sm border border-black/5"
                      // Dynamic token color — cannot be a static CSS class
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-600">{group}</span>
                <span className="text-xs text-gray-400">({groupTokens.length})</span>
              </div>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Token cards */}
            {!isCollapsed && (
              <div className="px-2 space-y-0.5">
                {groupTokens.map(token => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
}
