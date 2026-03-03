'use client';

import { useTokenMap } from '@/store/colorStore';

export default function Typography() {
  const c = useTokenMap();

  return (
    <div className="p-6 space-y-8" style={{ backgroundColor: c.background, color: c.onBackground }}>

      {/* Display / Heading scale */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.onSurfaceVariant }}>
          Headings
        </h3>
        <div className="space-y-3">
          {[
            { tag: 'Display Large', size: 'text-4xl', weight: 'font-normal', sample: 'Design System' },
            { tag: 'Headline Large', size: 'text-3xl', weight: 'font-normal', sample: 'Color Tokens' },
            { tag: 'Headline Medium', size: 'text-2xl', weight: 'font-normal', sample: 'Material Design 3' },
            { tag: 'Title Large', size: 'text-xl', weight: 'font-medium', sample: 'Primary & Secondary' },
            { tag: 'Title Medium', size: 'text-base', weight: 'font-medium', sample: 'Surface Container' },
            { tag: 'Title Small', size: 'text-sm', weight: 'font-medium', sample: 'Outline Variant' },
          ].map(({ tag, size, weight, sample }) => (
            <div key={tag} className="flex items-baseline gap-4">
              <div className="w-36 text-xs shrink-0" style={{ color: c.onSurfaceVariant }}>{tag}</div>
              <div className={`${size} ${weight}`} style={{ color: c.onBackground }}>{sample}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body text */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.onSurfaceVariant }}>
          Body Text
        </h3>
        <div className="space-y-4 max-w-lg">
          <div>
            <div className="text-xs mb-1" style={{ color: c.onSurfaceVariant }}>Body Large</div>
            <p className="text-base leading-relaxed" style={{ color: c.onBackground }}>
              디자인 시스템은 제품의 일관된 사용자 경험을 만들기 위한 색상, 타이포그래피, 컴포넌트의 집합입니다.
            </p>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: c.onSurfaceVariant }}>Body Medium</div>
            <p className="text-sm leading-relaxed" style={{ color: c.onBackground }}>
              4가지 기본 색상으로부터 28개의 디자인 토큰이 자동으로 생성됩니다. 각 토큰은 WCAG 접근성 기준을 충족합니다.
            </p>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: c.onSurfaceVariant }}>Body Small</div>
            <p className="text-xs leading-relaxed" style={{ color: c.onSurfaceVariant }}>
              토큰 이름을 클릭하면 설정을 변경할 수 있습니다. 규칙을 수정하거나 수동으로 색상을 지정할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Links & inline */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.onSurfaceVariant }}>
          Inline Elements
        </h3>
        <div className="text-sm leading-loose max-w-lg" style={{ color: c.onBackground }}>
          <p>
            디자인 토큰은{' '}
            <a className="underline cursor-pointer" style={{ color: c.primary }}>CSS 변수</a>
            {' '}또는{' '}
            <a className="underline cursor-pointer" style={{ color: c.primary }}>JSON 파일</a>
            로 내보낼 수 있습니다. <strong>Primary</strong>, <strong>Secondary</strong>, <em>Tertiary</em> 색상 그룹으로 구성됩니다.
          </p>
          <p className="mt-2">
            <span className="text-xs" style={{ color: c.error }}>* 오류 색상</span>
            {' '}은 사용자 입력 검증에 사용됩니다.
          </p>
        </div>
      </div>

      {/* Code block */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.onSurfaceVariant }}>
          Code
        </h3>
        <div className="rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto"
          style={{ backgroundColor: c.surfaceContainerHighest, color: c.onSurface }}>
          <div style={{ color: c.onSurfaceVariant }}>{'/* Generated Design Tokens */'}</div>
          <div><span style={{ color: c.tertiary }}>:root</span> {'{'}</div>
          <div className="ml-4"><span style={{ color: c.secondary }}>--primary</span>: <span style={{ color: c.primary }}>{'var(--primary)'}</span>;</div>
          <div className="ml-4"><span style={{ color: c.secondary }}>--onPrimary</span>: <span style={{ color: c.onPrimary }}>{'var(--onPrimary)'}</span>;</div>
          <div className="ml-4"><span style={{ color: c.secondary }}>--surface</span>: <span style={{ color: c.surface }}>{'var(--surface)'}</span>;</div>
          <div>{'}'}</div>
        </div>
      </div>

      {/* Label sizes */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.onSurfaceVariant }}>
          Labels
        </h3>
        <div className="flex flex-wrap gap-4 items-baseline">
          {[
            { tag: 'Label Large', size: 'text-sm', weight: 'font-medium' },
            { tag: 'Label Medium', size: 'text-xs', weight: 'font-medium' },
            { tag: 'Label Small', size: 'text-xs', weight: 'font-medium' },
          ].map(({ tag, size, weight }) => (
            <div key={tag} className="text-center">
              <div className={`${size} ${weight} px-3 py-1 rounded-full`}
                style={{ backgroundColor: c.surfaceContainerHigh, color: c.onSurface }}>
                {tag}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
