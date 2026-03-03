'use client';

import { useTokenMap } from '@/store/colorStore';

export default function ComponentGallery() {
  const c = useTokenMap();

  return (
    <div className="p-6 space-y-8" style={{ backgroundColor: c.background, color: c.onBackground }}>

      {/* Buttons */}
      <Section title="Buttons" c={c}>
        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-medium shadow-sm"
            style={{ backgroundColor: c.primary, color: c.onPrimary }}>
            Filled
          </button>
          <button className="px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer }}>
            Tonal
          </button>
          <button className="px-5 py-2.5 rounded-full text-sm font-medium border"
            style={{ borderColor: c.outline, color: c.primary, backgroundColor: 'transparent' }}>
            Outlined
          </button>
          <button className="px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ color: c.primary, backgroundColor: 'transparent' }}>
            Text
          </button>
          <button className="px-5 py-2.5 rounded-full text-sm font-medium opacity-40 cursor-not-allowed"
            style={{ backgroundColor: c.surfaceContainerHighest, color: c.onSurface }}>
            Disabled
          </button>
        </div>
      </Section>

      {/* Input Fields */}
      <Section title="Input Fields" c={c}>
        <div className="space-y-3 max-w-sm">
          {/* Default */}
          <div className="rounded-t-md overflow-hidden" style={{ backgroundColor: c.surfaceContainerHighest }}>
            <div className="px-4 pt-2 pb-1">
              <div className="text-xs mb-0.5" style={{ color: c.primary }}>Label</div>
              <div className="text-sm pb-1" style={{ color: c.onSurface }}>Input value</div>
            </div>
            <div className="h-0.5" style={{ backgroundColor: c.primary }} />
          </div>
          {/* Error */}
          <div className="rounded-t-md overflow-hidden" style={{ backgroundColor: c.surfaceContainerHighest }}>
            <div className="px-4 pt-2 pb-1">
              <div className="text-xs mb-0.5" style={{ color: c.error }}>Error Label</div>
              <div className="text-sm pb-1" style={{ color: c.onSurface }}>Invalid value</div>
            </div>
            <div className="h-0.5" style={{ backgroundColor: c.error }} />
            <div className="text-xs px-4 py-1" style={{ color: c.error }}>오류 메시지입니다</div>
          </div>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards" c={c}>
        <div className="grid grid-cols-3 gap-3">
          {/* Elevated card */}
          <div className="rounded-xl p-4 shadow-md" style={{ backgroundColor: c.surfaceContainerLow }}>
            <div className="w-8 h-8 rounded-full mb-3" style={{ backgroundColor: c.primaryContainer }} />
            <div className="text-sm font-semibold mb-1" style={{ color: c.onSurface }}>Elevated</div>
            <div className="text-xs" style={{ color: c.onSurfaceVariant }}>Shadow elevation</div>
          </div>
          {/* Filled card */}
          <div className="rounded-xl p-4" style={{ backgroundColor: c.surfaceContainerHighest }}>
            <div className="w-8 h-8 rounded-full mb-3" style={{ backgroundColor: c.secondaryContainer }} />
            <div className="text-sm font-semibold mb-1" style={{ color: c.onSurface }}>Filled</div>
            <div className="text-xs" style={{ color: c.onSurfaceVariant }}>Container filled</div>
          </div>
          {/* Outlined card */}
          <div className="rounded-xl p-4 border" style={{ borderColor: c.outlineVariant, backgroundColor: c.surface }}>
            <div className="w-8 h-8 rounded-full mb-3" style={{ backgroundColor: c.tertiaryContainer }} />
            <div className="text-sm font-semibold mb-1" style={{ color: c.onSurface }}>Outlined</div>
            <div className="text-xs" style={{ color: c.onSurfaceVariant }}>Border outline</div>
          </div>
        </div>
      </Section>

      {/* Chips */}
      <Section title="Chips & Badges" c={c}>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium border"
            style={{ borderColor: c.outline, color: c.onSurfaceVariant, backgroundColor: c.surface }}>
            Assist
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer }}>
            Filter ✓
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: c.tertiaryContainer, color: c.onTertiaryContainer }}>
            Input chip ×
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: c.primaryContainer, color: c.onPrimaryContainer }}>
            Suggestion
          </span>
          {/* Badge */}
          <div className="relative inline-flex">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: c.surfaceContainerHigh, color: c.onSurface }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: c.error, color: c.onError }}>3</span>
          </div>
        </div>
      </Section>

      {/* Toggle & Checkbox */}
      <Section title="Selection Controls" c={c}>
        <div className="flex flex-wrap gap-6 items-center">
          {/* Toggle on */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-12 h-6 rounded-full relative" style={{ backgroundColor: c.primary }}>
              <div className="absolute right-1 top-1 w-4 h-4 rounded-full" style={{ backgroundColor: c.onPrimary }} />
            </div>
            <span className="text-sm" style={{ color: c.onBackground }}>On</span>
          </label>
          {/* Toggle off */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-12 h-6 rounded-full relative border-2" style={{ backgroundColor: c.surfaceContainerHighest, borderColor: c.outline }}>
              <div className="absolute left-1 top-0.5 w-3 h-3 rounded-full" style={{ backgroundColor: c.outline }} />
            </div>
            <span className="text-sm" style={{ color: c.onBackground }}>Off</span>
          </label>
          {/* Checkbox checked */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 rounded flex items-center justify-center"
              style={{ backgroundColor: c.primary }}>
              <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm" style={{ color: c.onBackground }}>Checked</span>
          </label>
          {/* Checkbox unchecked */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 rounded border-2" style={{ borderColor: c.outline }} />
            <span className="text-sm" style={{ color: c.onBackground }}>Unchecked</span>
          </label>
          {/* Radio */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: c.primary }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.primary }} />
            </div>
            <span className="text-sm" style={{ color: c.onBackground }}>Radio</span>
          </label>
        </div>
      </Section>

      {/* Progress / Indicator */}
      <Section title="Progress Indicators" c={c}>
        <div className="space-y-3 max-w-xs">
          <div>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: c.surfaceContainerHighest }}>
              <div className="h-full w-3/5 rounded-full" style={{ backgroundColor: c.primary }} />
            </div>
            <div className="text-xs mt-1" style={{ color: c.onSurfaceVariant }}>Linear 60%</div>
          </div>
          <div>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: c.surfaceContainerHighest }}>
              <div className="h-full w-1/4 rounded-full" style={{ backgroundColor: c.tertiary }} />
            </div>
            <div className="text-xs mt-1" style={{ color: c.onSurfaceVariant }}>Tertiary 25%</div>
          </div>
        </div>
      </Section>

    </div>
  );
}

function Section({ title, c, children }: { title: string; c: Record<string,string>; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.onSurfaceVariant }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
