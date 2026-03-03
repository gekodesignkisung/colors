'use client';

import { DesignToken } from '@/types/tokens';
import { useColorStore } from '@/store/colorStore';

export default function TokenCard({ token }: { token: DesignToken }) {
  const { selectedTokenId, setSelectedToken } = useColorStore();
  const isSelected = selectedTokenId === token.id;

  return (
    <button
      type="button"
      onClick={() => setSelectedToken(isSelected ? null : token.id)}
      className={`w-full flex items-center text-left h-[38px] px-5 transition-colors
        ${isSelected ? 'bg-[#f0eeff] outline outline-2 outline-[#8b6fe8] -outline-offset-2' : 'bg-white hover:bg-gray-50'}
      `}
    >
      {/* 30×30 circle swatch — dynamic color requires inline style */}
      <div
        className="w-[30px] h-[30px] rounded-full border border-black/[0.08] shrink-0"
        style={{ backgroundColor: token.color }}
      />

      {/* Name + hex */}
      <div className="pl-[10px] flex items-center gap-1 flex-1 min-w-0">
        <span className="font-semibold text-[13px] text-[#333333] whitespace-nowrap">
          {token.name}
        </span>
        {token.isManual && (
          <span className="text-[10px] text-[#8b6fe8]">●</span>
        )}
        <span className="text-xs font-medium text-[#999999] font-mono">
          {token.color.toUpperCase()}
        </span>
      </div>
    </button>
  );
}
