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

export default function PageLayout() {
  const col = useCol();
  const variants = useVariants();
  const p  = variants[0] ?? 'primary';
  const s  = variants[1] ?? variants[0] ?? 'primary';
  const t3 = variants[2] ?? variants[1] ?? variants[0] ?? 'primary';

  const navItems = ['홈', '탐색', '저장', '설정'];

  return (
    <div className="flex flex-col min-h-[520px] rounded-xl overflow-hidden border border-black/10 bg-white">

      {/* App bar */}
      <div
        className="flex items-center justify-between px-5 h-14 shrink-0 shadow-sm"
        // eslint-disable-next-line react/forbid-dom-props
        style={{ backgroundColor: col(p, 'background', 'default') }}
      >
        <span className="font-semibold text-sm" style={{ color: col(p, 'text', 'default') }}>
          Design System
        </span>
        <div className="flex items-center gap-2">
          {[s, t3].map((v, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ backgroundColor: col(v, 'background', 'default'), color: col(v, 'text', 'default') }}
            >
              {v.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Nav rail */}
        <div className="w-20 flex flex-col items-center py-3 gap-1 shrink-0 bg-[#fafafa] border-r border-black/5">
          {navItems.map((label, i) => {
            const active = i === 0;
            const v = active ? p : s;
            return (
              <div
                key={label}
                className="flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl w-16 cursor-pointer"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundColor: active ? col(v, 'background', 'default') : 'transparent' }}
              >
                <div
                  className="w-5 h-5 rounded"
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ backgroundColor: active ? col(v, 'text', 'default') : '#bbb' }}
                />
                <span
                  className="text-[10px]"
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ color: active ? col(v, 'text', 'default') : '#999' }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f7]">

          {/* Banner */}
          <div
            className="rounded-2xl p-4"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ backgroundColor: col(p, 'background', 'hover') }}
          >
            <div className="text-sm font-semibold mb-1" style={{ color: col(p, 'text', 'default') }}>
              환영합니다!
            </div>
            <div className="text-xs mb-3 opacity-70" style={{ color: col(p, 'text', 'default') }}>
              생성된 디자인 토큰으로 만든 UI 미리보기입니다
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ backgroundColor: col(p, 'background', 'default'), color: col(p, 'text', 'default') }}
            >
              시작하기
            </button>
          </div>

          {/* Cards */}
          {[
            { label: '색상 팔레트', sub: '토큰 자동 생성', v: p },
            { label: '타이포그래피', sub: '텍스트 계층', v: s },
            { label: '간격 시스템', sub: '일관된 레이아웃', v: t3 },
          ].map(({ label, sub, v }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-black/5"
            >
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundColor: col(v, 'background', 'default'), color: col(v, 'text', 'default') }}
              >
                {label.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#333]">{label}</div>
                <div className="text-xs text-[#999]">{sub}</div>
              </div>
              <div
                className="w-2 h-2 rounded-full"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundColor: col(v, 'background', 'default') }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around px-4 h-14 border-t border-black/5 bg-white shrink-0">
        {navItems.map((item, i) => {
          const active = i === 0;
          return (
            <div key={item} className="flex flex-col items-center gap-0.5 cursor-pointer">
              <div
                className="px-4 py-1 rounded-full"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundColor: active ? col(p, 'background', 'default') : 'transparent' }}
              >
                <div
                  className="w-5 h-1 rounded"
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{ backgroundColor: active ? col(p, 'text', 'default') : '#ccc' }}
                />
              </div>
              <span
                className="text-[10px]"
                // eslint-disable-next-line react/forbid-dom-props
                style={{ color: active ? col(p, 'background', 'default') : '#bbb' }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
