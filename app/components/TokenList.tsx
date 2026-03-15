'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import TokenCard from './TokenCard';

const GENERATIVE = ['variant', 'type', 'state'];

interface TokenListProps {
  showNext?: boolean;
  onNext?: () => void;
}

export default function TokenList({ showNext, onNext }: TokenListProps) {
  const tokens        = useColorStore(s => s.tokens);
  const { isDark, toggleDark } = useColorStore();
  const namingEnabled = useColorStore(s => s.namingEnabled);
  const namingValues  = useColorStore(s => s.namingValues);

  // Active generative dimensions (as configured)
  const sortDims = namingEnabled.filter(d => GENERATIVE.includes(d));

  const [sortBy, setSortBy]   = useState<string>('');
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Default to first active dimension
  useEffect(() => {
    if (!sortBy && sortDims.length > 0) setSortBy(sortDims[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortDims.join(',')]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  // Sort tokens by the selected dimension's value order
  const sortedTokens = (() => {
    if (!sortBy) return tokens;
    const order = namingValues[sortBy] ?? [];
    const getRank = (t: typeof tokens[0]) => {
      const val =
        sortBy === 'variant' ? t.rule?.namingVariant :
        sortBy === 'type'    ? t.rule?.namingType    :
        sortBy === 'state'   ? t.rule?.namingState   : undefined;
      const idx = val ? order.indexOf(val) : -1;
      return idx === -1 ? order.length : idx;
    };
    return [...tokens].sort((a, b) => getRank(a) - getRank(b));
  })();

  const displayLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-14 bg-[#808090] px-[15px] gap-5">
        <span className="font-semibold text-[16px] text-white">Generated Colors</span>
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

      {/* Sort row */}
      <div className="flex items-center justify-between shrink-0 h-[40px] bg-[#f5f5f5] border-b border-[#dddddf] px-[15px]">
        <span className="font-semibold text-[13px] text-[#999]">
          Tokens <span className="font-normal text-[#bbb]">{tokens.length}</span>
        </span>

        <div ref={dropRef} className="relative">
          <button
            type="button"
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-1 h-[26px] px-2 bg-white border border-[#ddd] rounded-[6px] text-[12px] font-medium text-[#333] hover:border-[#bbb] transition-colors"
          >
            <span>Sort: {sortBy ? displayLabel(sortBy) : '—'}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-bullet-dn.svg" alt="" width={14} height={14} aria-hidden="true" />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#ddd] rounded-[8px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] overflow-hidden z-30 min-w-[110px]">
              {sortDims.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setSortBy(d); setDropOpen(false); }}
                  className={`w-full text-left px-3 h-[32px] text-[13px] font-medium transition-colors
                    ${sortBy === d ? 'text-[#606070] bg-[#f5f5f5]' : 'text-[#333] hover:bg-[#f9f9f9]'}`}
                >
                  {displayLabel(d)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flat token list */}
      <div className="flex-1 overflow-y-auto">
        {sortedTokens.map(token => (
          <TokenCard key={token.id} token={token} />
        ))}
      </div>
    </div>
  );
}
