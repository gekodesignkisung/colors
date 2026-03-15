'use client';

import { useColorStore } from '@/store/colorStore';
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

function useVariants() {
  const tokens = useColorStore(s => s.tokens);
  return [...new Set(tokens.filter(t => t.rule.namingVariant).map(t => t.rule.namingVariant!))];
}

export default function ModalPreview() {
  const col = useCol();
  const variants = useVariants();
  const { getColor } = usePreviewContext();
  const p  = variants[0] ?? 'primary';
  const s  = variants[1] ?? variants[0] ?? 'primary';
  const t3 = variants[2] ?? variants[1] ?? variants[0] ?? 'primary';

  return (
    <div className="p-8 flex flex-col gap-10 bg-[#fff] min-h-full">

      {/* Alert Dialog */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Alert Dialog</p>
        <div className="inline-block rounded-3xl p-6 shadow-xl w-72 bg-white border border-black/5">
          <div className="text-base font-semibold mb-2 text-[#222]">변경사항을 저장할까요?</div>
          <div className="text-sm mb-5 leading-relaxed text-[#666]">
            저장하지 않으면 현재 작업한 내용이 사라집니다.
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm font-medium border-0 cursor-pointer bg-transparent"
              id="alert-cancel"
              data-color-el="alert-cancel"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: getColor('alert-cancel', p, 'background', 'default') }}
            >
              취소
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm font-medium border-0 cursor-pointer"
              id="alert-save"
              data-color-el="alert-save"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ backgroundColor: getColor('alert-save', p, 'background', 'default'), color: getColor('alert-save', p, 'text', 'default') }}
            >
              저장
            </button>
          </div>
        </div>
      </section>

      {/* Action Sheet */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Action Sheet</p>
        <div className="rounded-t-3xl shadow-xl overflow-hidden w-80 bg-white border border-black/5">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-8 h-1 rounded-full bg-[#ddd]" />
          </div>
          <div className="px-5 pb-6">
            <div className="text-base font-semibold mb-4 text-[#222]">공유하기</div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {(['링크', '메시지', '이메일', '더보기'] as const).map((label, i) => {
                const v = [p, s, t3, p][i];
                return (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base"
                      // eslint-disable-next-line react/forbid-dom-props
                      id={`action-${label}`}
                      data-color-el={`action-${label}`}
                      style={{ backgroundColor: getColor(`action-${label}`, v, 'background', 'default') }}
                    >
                      <span style={{ color: getColor(`action-${label}`, v, 'text', 'default') }}>
                        {['🔗', '💬', '✉️', '···'][i]}
                      </span>
                    </div>
                    <span className="text-xs text-[#999]">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-px mb-4 bg-[#eee]" />
            <button
              type="button"
              className="w-full py-3 rounded-full text-sm font-medium border-0 cursor-pointer bg-[#f0f0f0] text-[#555]"
            >
              취소
            </button>
          </div>
        </div>
      </section>

      {/* Snackbar & Tooltip */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Snackbar & Tooltip</p>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Tooltip */}
          <div className="flex flex-col items-center gap-1">
            <div
              id="tooltip-box"
              data-color-el="tooltip-box"
              className="px-3 py-2 rounded-lg text-xs shadow-lg text-white"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ backgroundColor: getColor('tooltip-box', s, 'background', 'default') }}
            >
              이 항목에 대한 설명입니다
            </div>
            <div
              data-color-el="tooltip-arrow"
              className="w-2 h-2 rotate-45 -mt-1.5"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ backgroundColor: getColor('tooltip-arrow', s, 'background', 'default') }}
            />
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm border-0 cursor-pointer"
              id="tooltip-hover-button"
              data-color-el="tooltip-hover-button"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ backgroundColor: getColor('tooltip-hover-button', s, 'background', 'hover'), color: getColor('tooltip-hover-button', s, 'text', 'default') }}
            >
              Hover me
            </button>
          </div>
          {/* Snackbar */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            id="snackbar"
            data-color-el="snackbar"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ backgroundColor: getColor('snackbar', t3, 'background', 'default'), color: getColor('snackbar', t3, 'text', 'default') }}
          >
            <span className="text-sm">저장이 완료되었습니다</span>
            <button
              data-color-el="snackbar-cancel"
              type="button"
              className="text-sm font-semibold border-0 cursor-pointer bg-transparent underline"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ color: getColor('snackbar-cancel', t3, 'text', 'default') }}
            >
              실행취소
            </button>
          </div>
        </div>
      </section>

      {/* Dropdown Menu */}
      <section>
        <p className="text-[11px] font-semibold text-[#909099] uppercase tracking-widest mb-4">Dropdown Menu</p>
        <div className="inline-block rounded-xl shadow-xl overflow-hidden w-48 bg-white border border-black/5">
          {[
            { label: '편집', icon: '✏️', v: p },
            { label: '복사', icon: '📋', v: s },
            { label: '공유', icon: '↗️', v: t3 },
          ].map(({ label, icon, v }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            >
              <span className="text-sm">{icon}</span>
              <span className="text-sm text-[#333]">{label}</span>
              <div
                id={`dropdown-${label}`}
                data-color-el={`dropdown-${label}`}
                className="ml-auto w-2 h-2 rounded-full"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundColor: getColor(`dropdown-${label}`, v, 'background', 'default') }}
              />
            </div>
          ))}
          <div className="h-px mx-3 bg-[#eee]" />
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#fef2f2] transition-colors">
            <span className="text-sm">🗑️</span>
            <span className="text-sm text-red-500">삭제</span>
          </div>
        </div>
      </section>

    </div>
  );
}
