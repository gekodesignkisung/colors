'use client';

import { DesignToken } from '@/types/tokens';
import { useColorStore } from '@/store/colorStore';
import { ColorShape } from '@/app/components/ColorShape';

function toFormulaLabel(token: DesignToken): string {
  const { rule } = token;

  if (rule.operation === 'manual' || rule.operation === 'fixed') return 'manual';

  // Naming-based token: show derivation chain
  if (rule.namingVariant) {
    const variant = rule.namingVariant;
    const type    = rule.namingType    ?? '';
    const state   = rule.namingState   ?? 'default';

    const stateStr =
      state === 'hover'    ? ` +${rule.stateAmount ?? 8}%` :
      state === 'pressed'  ? ` −${rule.stateAmount ?? 10}%` :
      state === 'disabled' ? ' disabled' : '';

    const typeStr =
      type === 'text' || type === 'icon' ? 'contrast' :
      type === 'border' || type === 'outline' ? 'muted' :
      'source';

    return `${variant}${stateStr} → ${typeStr}`;
  }

  // Operation-based token
  const op = rule.operation;
  const src = rule.source ?? '';
  if (op === 'source')   return src;
  if (op === 'lighten')  return `${src} +${rule.param ?? ''}%`;
  if (op === 'darken')   return `${src} −${rule.param ?? ''}%`;
  if (op === 'contrast') return `contrast(${src})`;
  if (op === 'grayscale') return `grayscale(${src})`;
  if (op === 'invert')   return `invert(${src})`;
  return op;
}

export default function TokenCard({ token }: { token: DesignToken }) {
  const { selectedTokenId, setSelectedToken, previewAssignments } = useColorStore();
  const isSelected = selectedTokenId === token.id;
  const formulaLabel = toFormulaLabel(token);

  // Count how many elements have this token assigned
  const assignmentCount = Object.values(previewAssignments).filter(id => id === token.id).length;

  return (
    <button
      type="button"
      onClick={(e) => setSelectedToken(isSelected ? null : token.id, isSelected ? undefined : { x: e.clientX, y: e.clientY })}
      className={`w-full flex items-center text-left h-[56px] px-5 transition-colors
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
        <span className="font-mono font-medium truncate text-[11px] leading-[14px] text-[#999999]">
          {formulaLabel}
        </span>
      </div>
    </button>
  );
}
