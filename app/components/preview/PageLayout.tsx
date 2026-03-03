'use client';

import { useTokenMap } from '@/store/colorStore';

export default function PageLayout() {
  const c = useTokenMap();

  return (
    <div className="flex flex-col h-full min-h-[480px] rounded-xl overflow-hidden border" style={{ borderColor: c.outlineVariant }}>
      {/* App Bar */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 shadow-sm" style={{ backgroundColor: c.surface }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.primaryContainer }}>
            <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
              style={{ color: c.onPrimaryContainer }}>A</div>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: c.onSurface }}>App Name</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: c.surfaceContainerHigh }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: c.onSurface }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: c.primaryContainer }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: c.onPrimaryContainer }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Rail */}
        <div className="w-20 flex flex-col items-center py-4 gap-1 shrink-0" style={{ backgroundColor: c.surface }}>
          {[
            { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home', active: true },
            { icon: 'M4 6h16M4 12h16M4 18h7', label: 'Feed', active: false },
            { icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', label: 'Saved', active: false },
            { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Settings', active: false },
          ].map(({ icon, label, active }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl w-16 cursor-pointer"
              style={{ backgroundColor: active ? c.secondaryContainer : 'transparent' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: active ? c.onSecondaryContainer : c.onSurfaceVariant }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span className="text-xs" style={{ color: active ? c.onSecondaryContainer : c.onSurfaceVariant }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: c.background }}>
          {/* Banner card */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: c.primaryContainer }}>
            <div className="text-sm font-semibold mb-1" style={{ color: c.onPrimaryContainer }}>Welcome back!</div>
            <div className="text-xs mb-3" style={{ color: c.onPrimaryContainer, opacity: 0.8 }}>
              오늘의 디자인 토큰을 확인하세요
            </div>
            <button className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: c.primary, color: c.onPrimary }}>
              시작하기
            </button>
          </div>

          {/* List items */}
          {[
            { title: '색상 팔레트', sub: 'Primary group · 4 tokens', badge: 'New' },
            { title: '타이포그래피', sub: 'Typography tokens · 6 tokens', badge: null },
            { title: '간격 시스템', sub: 'Spacing · 8 tokens', badge: null },
          ].map(({ title, sub, badge }) => (
            <div key={title} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: c.surfaceContainer }}>
              <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                style={{ backgroundColor: c.secondaryContainer }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: c.onSecondaryContainer }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: c.onSurface }}>{title}</div>
                <div className="text-xs" style={{ color: c.onSurfaceVariant }}>{sub}</div>
              </div>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: c.tertiaryContainer, color: c.onTertiaryContainer }}>
                  {badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav (mobile style) */}
      <div className="flex items-center justify-around px-4 h-14 border-t shrink-0"
        style={{ backgroundColor: c.surface, borderColor: c.outlineVariant }}>
        {['Home', 'Explore', 'Create', 'Profile'].map((item, i) => (
          <div key={item} className="flex flex-col items-center gap-0.5 cursor-pointer">
            <div className={`px-4 py-1 rounded-full ${i === 0 ? 'font-medium' : ''}`}
              style={{ backgroundColor: i === 0 ? c.secondaryContainer : 'transparent' }}>
              <div className="w-5 h-1 rounded" style={{ backgroundColor: i === 0 ? c.onSecondaryContainer : c.onSurfaceVariant, opacity: i === 0 ? 1 : 0.5 }} />
            </div>
            <span className="text-xs" style={{ color: i === 0 ? c.onSecondaryContainer : c.onSurfaceVariant }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
