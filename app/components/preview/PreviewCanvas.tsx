'use client';

import { useColorStore, useTokenMap } from '@/store/colorStore';
import { PreviewTab } from '@/types/tokens';
import ComponentGallery from './ComponentGallery';
import PageLayout from './PageLayout';
import ModalPreview from './ModalPreview';
import Typography from './Typography';

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'page',       label: 'Page Layout' },
  { id: 'components', label: 'Components' },
  { id: 'modals',     label: 'Modals' },
  { id: 'typography', label: 'Typography' },
];

export default function PreviewCanvas() {
  const { activePreviewTab, setActivePreviewTab, exportCSS, exportJSON } = useColorStore();
  const c = useTokenMap();

  const downloadCSS = () => {
    const css = exportCSS();
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-tokens.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const json = exportJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — #909099, 56px */}
      <div className="flex items-center shrink-0 h-14 bg-[#909099] pl-10 pr-5 gap-5">
        {/* Tab buttons */}
        <div className="flex items-center gap-px">
          {TABS.map(tab => {
            const isActive = tab.id === activePreviewTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className={`h-10 px-[30px] bg-white rounded-[4px] text-sm transition-colors cursor-pointer
                  ${isActive ? 'font-semibold text-[#333333]' : 'font-medium text-[#606066] hover:text-[#333333]'}
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Export buttons */}
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            title="CSS 내보내기"
            aria-label="CSS 내보내기"
            onClick={downloadCSS}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md bg-white/15 hover:bg-white/25 transition-colors cursor-pointer border-0"
          >
            <svg width="15" height="18" viewBox="0 0 15 18" fill="none" aria-hidden="true">
              <path d="M1.5 2.5l1.2 11 4.8 1.5 4.8-1.5 1.2-11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6h9M4 9h7M5 12h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            type="button"
            title="JSON 내보내기"
            aria-label="JSON 내보내기"
            onClick={downloadJSON}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md bg-white/15 hover:bg-white/25 transition-colors cursor-pointer border-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v9M4 8l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 14h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto">
        {activePreviewTab === 'components' && <ComponentGallery />}
        {activePreviewTab === 'page' && (
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
