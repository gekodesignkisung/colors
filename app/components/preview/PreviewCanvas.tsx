'use client';

import { useColorStore } from '@/store/colorStore';
import { PreviewTab } from '@/types/tokens';
import ComponentGallery from './ComponentGallery';
import PageLayout from './PageLayout';
import ModalPreview from './ModalPreview';
import Typography from './Typography';

const imgIconCss = 'http://localhost:3845/assets/20931ba4839fb9d136dfdb9878363a20da236af1.svg';
const imgIconDownload = 'http://localhost:3845/assets/de40b756431c808475b9e354556c103f0b19b93f.svg';

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'page',       label: 'Page Layout' },
  { id: 'components', label: 'Components' },
  { id: 'modals',     label: 'Modals' },
  { id: 'typography', label: 'Typography' },
];

export default function PreviewCanvas() {
  const { activePreviewTab, setActivePreviewTab, exportCSS, exportJSON } = useColorStore();

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
      {/* Header — Figma node 7:3 */}
      <div className="flex items-end justify-between shrink-0 h-14 pl-[40px] pr-[20px] bg-[rgba(96,96,112,0.8)]">
        {/* Tab buttons — bottom-aligned, 1px gap */}
        <div className="flex items-end gap-px">
          {TABS.map(tab => {
            const isActive = tab.id === activePreviewTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className={`h-[40px] px-[30px] overflow-hidden cursor-pointer transition-colors
                  font-medium text-[14px] text-[#404050] whitespace-nowrap border-0
                  ${isActive
                    ? 'bg-white'
                    : 'bg-[rgba(255,255,255,0.9)] border-b border-[#909099] hover:bg-white'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Export icon buttons */}
        <div className="flex items-center gap-[10px] pb-[13px]">
          <button
            type="button"
            title="CSS 내보내기"
            aria-label="CSS 내보내기"
            onClick={downloadCSS}
            className="relative shrink-0 w-[30px] h-[30px] cursor-pointer hover:opacity-70 transition-opacity border-0 bg-transparent p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="block w-full h-full" src={imgIconCss} />
          </button>
          <button
            type="button"
            title="JSON 내보내기"
            aria-label="JSON 내보내기"
            onClick={downloadJSON}
            className="relative shrink-0 w-[30px] h-[30px] cursor-pointer hover:opacity-70 transition-opacity border-0 bg-transparent p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="block w-full h-full" src={imgIconDownload} />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto preview-area">
        {activePreviewTab === 'components' && <ComponentGallery />}
        {activePreviewTab === 'page' && (
          <div className="p-6 bg-[#f5f5f7]">
            <PageLayout />
          </div>
        )}
        {activePreviewTab === 'modals'     && <ModalPreview />}
        {activePreviewTab === 'typography' && <Typography />}
      </div>
    </div>
  );
}
