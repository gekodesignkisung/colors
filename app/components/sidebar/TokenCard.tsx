'use client';

import { DesignToken } from '@/types/tokens';
import { useColorStore } from '@/store/colorStore';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';

function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `oklch(${l.toFixed(2)} ${c.toFixed(3)} ${Math.round(h)}°)`;
}

export default function TokenCard({ token }: { token: DesignToken }) {
  const { selectedTokenId, setSelectedToken, useOklch, previewAssignments } = useColorStore();
  const isSelected = selectedTokenId === token.id;
  const colorLabel = useOklch ? toOklchLabel(token.color) : token.color.toUpperCase();

  // Count how many elements have this token assigned
  const assignmentCount = Object.values(previewAssignments).filter(id => id === token.id).length;

  return (
    <button
      type="button"
      onClick={() => setSelectedToken(isSelected ? null : token.id)}
      className={`w-full flex items-center text-left h-[46px] px-5 transition-colors
        ${isSelected ? 'bg-[#f0eeff] outline outline-2 outline-[#8b6fe8] -outline-offset-2' : 'bg-white hover:bg-gray-50'}
      `}
    >
      {/* 30×30 squircle swatch */}
      <ColorShape
        color={token.color}
        size={40}
        className="shrink-0"
        borderColor={isSelected ? '#8b6fe8' : undefined}
        borderWidth={isSelected ? 2 : undefined}
      />

      {/* Name + color value (stacked) */}
      <div className="pl-[10px] flex flex-col justify-center flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] text-[#333333] whitespace-nowrap">
              {token.name}
            </span>
            {token.isManual && (
              <span className="text-[10px] text-[#8b6fe8]">●</span>
            )}
          </div>
          {assignmentCount > 0 && (
            <span className="text-[10px] text-[#999999] font-semibold">
              {assignmentCount}
            </span>
          )}
        </div>
        <span className={`font-mono truncate ${useOklch ? 'text-[10px] text-[#a78bfa]' : 'text-[11px] text-[#999999]'}`}>
          {colorLabel}
        </span>
      </div>
    </button>
  );
}
