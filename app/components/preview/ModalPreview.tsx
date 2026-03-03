'use client';

import { useTokenMap } from '@/store/colorStore';

export default function ModalPreview() {
  const c = useTokenMap();

  return (
    <div className="p-6 space-y-8" style={{ backgroundColor: c.background, color: c.onBackground }}>

      {/* Alert Dialog */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.onSurfaceVariant }}>Alert Dialog</h3>
        <div className="inline-block">
          <div className="rounded-3xl p-6 shadow-xl w-72" style={{ backgroundColor: c.surface }}>
            <div className="text-base font-semibold mb-2" style={{ color: c.onSurface }}>변경사항을 저장할까요?</div>
            <div className="text-sm mb-5 leading-relaxed" style={{ color: c.onSurfaceVariant }}>
              저장하지 않으면 현재 작업한 내용이 사라집니다.
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ color: c.primary, backgroundColor: 'transparent' }}>
                취소
              </button>
              <button className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: c.primary, color: c.onPrimary }}>
                저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.onSurfaceVariant }}>Error Dialog</h3>
        <div className="inline-block">
          <div className="rounded-3xl p-6 shadow-xl w-72" style={{ backgroundColor: c.surface }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: c.errorContainer }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: c.error }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.072 16.5c-.77.833.193 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-base font-semibold mb-2" style={{ color: c.onSurface }}>오류가 발생했습니다</div>
            <div className="text-sm mb-5" style={{ color: c.onSurfaceVariant }}>서버와의 연결이 끊겼습니다. 잠시 후 다시 시도해주세요.</div>
            <button className="w-full py-2.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: c.errorContainer, color: c.onErrorContainer }}>
              확인
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.onSurfaceVariant }}>Bottom Sheet</h3>
        <div className="rounded-t-3xl shadow-xl overflow-hidden w-80" style={{ backgroundColor: c.surface }}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-8 h-1 rounded-full" style={{ backgroundColor: c.outlineVariant }} />
          </div>
          <div className="px-5 pb-6">
            <div className="text-base font-semibold mb-4" style={{ color: c.onSurface }}>공유하기</div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {['링크', '메시지', '이메일', '더보기'].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: [c.primaryContainer, c.secondaryContainer, c.tertiaryContainer, c.surfaceContainerHighest][i] }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: [c.onPrimaryContainer, c.onSecondaryContainer, c.onTertiaryContainer, c.onSurface][i] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <span className="text-xs" style={{ color: c.onSurfaceVariant }}>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-px mb-4" style={{ backgroundColor: c.outlineVariant }} />
            <button className="w-full py-3 rounded-full text-sm font-medium"
              style={{ backgroundColor: c.surfaceContainerHighest, color: c.onSurface }}>
              취소
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip & Snackbar */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.onSurfaceVariant }}>Tooltip & Snackbar</h3>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Tooltip */}
          <div className="relative inline-flex flex-col items-center gap-1">
            <div className="px-3 py-2 rounded-lg text-xs shadow-lg"
              style={{ backgroundColor: c.surfaceContainerHighest, color: c.onSurface }}>
              이 항목에 대한 설명입니다
            </div>
            <div className="w-2 h-2 rotate-45 -mt-1.5"
              style={{ backgroundColor: c.surfaceContainerHighest }} />
            <button className="px-4 py-2 rounded-full text-sm" style={{ backgroundColor: c.primaryContainer, color: c.onPrimaryContainer }}>
              Hover me
            </button>
          </div>
          {/* Snackbar */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            style={{ backgroundColor: c.surfaceContainerHighest, color: c.onSurface }}>
            <span className="text-sm">저장이 완료되었습니다</span>
            <button className="text-sm font-semibold" style={{ color: c.tertiary }}>실행취소</button>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.onSurfaceVariant }}>Dropdown Menu</h3>
        <div className="inline-block rounded-xl shadow-xl overflow-hidden w-48"
          style={{ backgroundColor: c.surface, border: `1px solid ${c.outlineVariant}` }}>
          {[
            { label: '편집', icon: '✏️' },
            { label: '복사', icon: '📋' },
            { label: '공유', icon: '↗️' },
          ].map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: c.surface }}>
              <span className="text-sm">{icon}</span>
              <span className="text-sm" style={{ color: c.onSurface }}>{label}</span>
            </div>
          ))}
          <div className="h-px mx-3" style={{ backgroundColor: c.outlineVariant }} />
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            style={{ backgroundColor: c.surface }}>
            <span className="text-sm">🗑️</span>
            <span className="text-sm" style={{ color: c.error }}>삭제</span>
          </div>
        </div>
      </div>

    </div>
  );
}
