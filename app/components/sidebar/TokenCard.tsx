'use client';

import { DesignToken } from '@/types/tokens';
import { useColorStore } from '@/store/colorStore';
import { getOnColor } from '@/lib/colorUtils';

export default function TokenCard({ token }: { token: DesignToken }) {
  const { selectedTokenId, setSelectedToken } = useColorStore();
  const isSelected = selectedTokenId === token.id;

  const textColor = getOnColor(token.color);

  return (
    <button
      onClick={() => setSelectedToken(isSelected ? null : token.id)}
      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all
        ${isSelected
          ? 'ring-2 ring-violet-500 bg-violet-50'
          : 'hover:bg-gray-50'
        }
      `}
    >
      {/* Color swatch */}
      <div
        className="w-6 h-6 rounded-md border border-black/10 shrink-0 shadow-sm flex items-center justify-center"
        style={{ backgroundColor: token.color }}
      >
        {token.isManual && (
          <span style={{ color: textColor, fontSize: 8, lineHeight: 1 }}>★</span>
        )}
      </div>

      {/* Name + hex */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 truncate leading-none mb-0.5">
          {token.name}
        </div>
        <div className="text-xs text-gray-400 font-mono">{token.color}</div>
      </div>

      {/* Edit indicator */}
      <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
