'use client';

import { useColorStore } from '@/store/colorStore';
import { hexToHSL } from '@/lib/colorUtils';
import { usePreviewContext } from './PreviewContext';

function useCol() {
  const tokens = useColorStore(s => s.tokens);
  return (variant: string, type: string, state: string): string =>
    tokens.find(t =>
      t.rule.namingVariant === variant &&
      t.rule.namingType    === type    &&
      t.rule.namingState   === state
    )?.color ?? '#cccccc';
}

const TYPE_ABBR: Record<string, string> = { background: 'BG', text: 'TX', border: 'BD', icon: 'IC' };
const STATE_LABELS: Record<string, string> = { default: 'Default', hover: 'Hover', pressed: 'Pressed', disabled: 'Disabled' };

function Swatch({ color, hint, id }: { color: string; hint: string; id?: string }) {
  const dark = hexToHSL(color).l < 55;
  return (
    <div
      id={id}
      className="w-[52px] h-[46px] rounded-[8px] flex items-center justify-center cursor-default"
      title={hint}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ backgroundColor: color }}
    >
      <span className={`text-[9px] font-semibold ${dark ? 'text-white/60' : 'text-black/40'}`}>
        {color.toUpperCase()}
      </span>
    </div>
  );
}

export default function ComponentGallery() {
  const tokens = useColorStore(s => s.tokens);
  const col = useCol();
  const { getColor } = usePreviewContext();

  const variants = [...new Set(tokens.map(t => t.group))];
  const states   = [...new Set(tokens.filter(t => t.rule.namingState).map(t => t.rule.namingState!))];
  const types    = [...new Set(tokens.filter(t => t.rule.namingType).map(t => t.rule.namingType!))];

  return (
    <div className="p-8 flex flex-col gap-10 bg-[#fff] min-h-full">
      {variants.map(variant => {
        const cap = variant.charAt(0).toUpperCase() + variant.slice(1);
        return (
          <section key={variant}>
            <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">{cap}</p>

            {/* Buttons — one per state */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
              {states.map(state => (
                <button
                  id={`${variant}-button-${state}`}
                  type="button"
                  key={state}
                  className="px-5 h-10 rounded-[10px] text-[13px] font-semibold border"
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{
                    backgroundColor: getColor(`${variant}-button-${state}`, variant, 'background', state),
                    color:           getColor(`${variant}-button-${state}`, variant, 'text',       state),
                    borderColor:     getColor(`${variant}-button-${state}`, variant, 'border',     state),
                  }}
                >
                  {STATE_LABELS[state] ?? state}
                </button>
              ))}
            </div>

            {/* Swatch grid: type rows × state columns */}
            <div className="flex flex-col gap-1.5">
              {types.map(type => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-7 text-right text-[10px] font-semibold text-[#bbb] shrink-0">
                    {TYPE_ABBR[type] ?? type}
                  </span>
                  {states.map(state => (
                    <Swatch
                      id={`${variant}-swatch-${type}-${state}`}
                      key={state}
                      color={getColor(`${variant}-swatch-${type}-${state}`, variant, type, state)}
                      hint={`${variant}.${type}.${state}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-6 h-px bg-[#e5e5e5]" />
          </section>
        );
      })}
    </div>
  );
}
