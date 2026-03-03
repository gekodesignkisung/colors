'use client';

import { useColorStore } from '@/store/colorStore';
import { PreviewTab } from '@/types/tokens';
import { useTokenMap } from '@/store/colorStore';
import ComponentGallery from './ComponentGallery';
import PageLayout from './PageLayout';
import ModalPreview from './ModalPreview';
import Typography from './Typography';

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'components', label: 'Components' },
  { id: 'page',       label: 'Page Layout' },
  { id: 'modals',     label: 'Modals' },
  { id: 'typography', label: 'Typography' },
];

export default function PreviewCanvas() {
  const { activePreviewTab, setActivePreviewTab } = useColorStore();
  const c = useTokenMap();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b shrink-0"
        style={{ backgroundColor: c.surface, borderColor: c.outlineVariant }}>
        {TABS.map(tab => {
          const isActive = tab.id === activePreviewTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePreviewTab(tab.id)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? c.secondaryContainer : 'transparent',
                color: isActive ? c.onSecondaryContainer : c.onSurfaceVariant,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto">
        {activePreviewTab === 'components' && <ComponentGallery />}
        {activePreviewTab === 'page'       && (
          <div className="p-6" style={{ backgroundColor: c.background }}>
            <PageLayout />
          </div>
        )}
        {activePreviewTab === 'modals'     && <ModalPreview />}
        {activePreviewTab === 'typography' && <Typography />}
      </div>
    </div>
  );
}
