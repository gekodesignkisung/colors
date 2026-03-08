'use client';

import { useColorStore } from '@/store/colorStore';

function useCol() {
  const tokens = useColorStore(s => s.tokens);
  return (variant: string, type: string, state: string): string =>
    tokens.find(t =>
      t.rule.namingVariant === variant &&
      t.rule.namingType    === type    &&
      t.rule.namingState   === state
    )?.color ?? '#cccccc';
}

function useVariants() {
  const tokens = useColorStore(s => s.tokens);
  return [...new Set(tokens.filter(t => t.rule.namingVariant).map(t => t.rule.namingVariant!))];
}

export default function Typography() {
  const col = useCol();
  const variants = useVariants();
  const p  = variants[0] ?? 'primary';
  const s  = variants[1] ?? variants[0] ?? 'primary';
  const t3 = variants[2] ?? variants[1] ?? variants[0] ?? 'primary';

  return (
    <div className="p-8 flex flex-col gap-10 bg-[#fff] min-h-full">

      {/* Headings */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Headings</p>
        <div className="space-y-3 bg-white rounded-xl p-5 border border-black/5">
          {[
            { label: 'Display', size: 'text-4xl', weight: 'font-normal', sample: 'Design System' },
            { label: 'Headline', size: 'text-3xl', weight: 'font-normal', sample: 'Color Tokens' },
            { label: 'Title L', size: 'text-xl',  weight: 'font-semibold', sample: 'Primary & Secondary' },
            { label: 'Title M', size: 'text-base', weight: 'font-medium',  sample: 'Surface Container' },
            { label: 'Body',   size: 'text-sm',  weight: 'font-normal',  sample: 'Outline Variant' },
            { label: 'Label',  size: 'text-xs',  weight: 'font-medium',  sample: 'Caption text' },
          ].map(({ label, size, weight, sample }, i) => (
            <div key={label} className="flex items-baseline gap-4">
              <span className="w-16 text-[10px] text-[#bbb] shrink-0 text-right">{label}</span>
              <span
                className={`${size} ${weight} text-[#222]`}
                // eslint-disable-next-line react/forbid-dom-props
                style={i === 0 ? { color: col(p, 'text', 'default') } : undefined}
              >
                {sample}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Color-accented body text */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Body Text</p>
        <div className="bg-white rounded-xl p-5 border border-black/5 space-y-4 max-w-lg">
          <p className="text-base leading-relaxed text-[#333]">
            디자인 시스템은 제품의 일관된 사용자 경험을 만들기 위한{' '}
            <a
              className="underline cursor-pointer font-medium"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: col(p, 'background', 'default') }}
            >
              색상
            </a>
            ,{' '}
            <a
              className="underline cursor-pointer font-medium"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: col(s, 'background', 'default') }}
            >
              타이포그래피
            </a>
            ,{' '}
            <a
              className="underline cursor-pointer font-medium"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: col(t3, 'background', 'default') }}
            >
              컴포넌트
            </a>
            의 집합입니다.
          </p>
          <p className="text-sm leading-relaxed text-[#555]">
            각 토큰은 OKLCH 색공간 기반으로 자동 생성됩니다. 수식을 수정하면 연관 토큰이 함께 업데이트됩니다.
          </p>
          <p className="text-xs leading-relaxed text-[#888]">
            토큰 이름을 클릭하면 설정을 변경할 수 있습니다. 규칙을 수정하거나 수동으로 색상을 지정할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Variant color chips */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Variant Colors</p>
        <div className="flex flex-wrap gap-3">
          {variants.map(v => (
            <div key={v} className="flex flex-col gap-1">
              {(['default', 'hover', 'pressed', 'disabled'] as const).map(state => (
                <div
                  key={state}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ backgroundColor: col(v, 'background', state) }}
                >
                  <span
                    className="text-[11px] font-medium"
                    // eslint-disable-next-line react/forbid-dom-props
                    style={{ color: col(v, 'text', state) }}
                  >
                    {v} · {state}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Code block */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Code</p>
        <div
          className="rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto bg-[#1e1e2e] text-[#cdd6f4]"
        >
          <div className="text-[#6c7086]">{'/* Generated Design Tokens */'}</div>
          <div>
            <span
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: col(p, 'background', 'default') }}
            >:root</span>
            {' {'}
          </div>
          {variants.slice(0, 3).map(v => (
            <div key={v} className="ml-4">
              <span className="text-[#6c7086]">--{v}: </span>
              <span
                className="font-semibold"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ color: col(v, 'background', 'default') }}
              >
                {col(v, 'background', 'default')}
              </span>
              <span className="text-[#6c7086]">;</span>
            </div>
          ))}
          <div>{'}'}</div>
        </div>
      </section>

    </div>
  );
}
