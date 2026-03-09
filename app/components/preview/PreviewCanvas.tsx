'use client';

import { useColorStore } from '@/store/colorStore';
import { PreviewTab } from '@/types/tokens';
import HomePage from './HomePage';
import ComponentGallery from './ComponentGallery';
import PageLayout from './PageLayout';
import ModalPreview from './ModalPreview';
import Typography from './Typography';
import { PreviewProvider, usePreviewContext } from './PreviewContext';
import TokenAssignPanel from './TokenAssignPanel';
import { useRef, useEffect } from 'react';

const imgIconCss = 'http://localhost:3845/assets/20931ba4839fb9d136dfdb9878363a20da236af1.svg';
const imgIconDownload = 'http://localhost:3845/assets/de40b756431c808475b9e354556c103f0b19b93f.svg';

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'home',       label: 'Home Page' },
  { id: 'page',       label: 'Page Layout' },
  { id: 'components', label: 'Components' },
  { id: 'modals',     label: 'Modals' },
  { id: 'typography', label: 'Typography' },
];

function PreviewCanvasInner() {
  const { activePreviewTab, setActivePreviewTab, exportCSS, exportJSON } = useColorStore();
  const { isEditMode, setIsEditMode, selectedElementId, setSelectedElementId, setPanelAnchor } = usePreviewContext();
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Edit mode changed:', isEditMode);

    if (!isEditMode || !previewRef.current) {
      console.log('Listener not attached:', { isEditMode, hasRef: !!previewRef.current });
      return;
    }

    console.log('✅ Click listener attached');

    const handleClick = (e: MouseEvent) => {
      // Skip if user selected text
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        console.log('Text selected, skipping element selection');
        return;
      }

      const target = e.target as HTMLElement;
      const element = target.closest('[id]') as HTMLElement;

      if (!element) {
        console.log('Click on:', target.tagName, target.className);
        return;
      }

      const elementId = element.getAttribute('id');
      console.log('🎯 Clicked element:', elementId);

      if (elementId) {
        setSelectedElementId(elementId);
        setPanelAnchor({ x: e.clientX, y: e.clientY });
      }
    };

    const preview = previewRef.current;
    preview.addEventListener('click', handleClick, true); // Use capture phase

    return () => {
      preview.removeEventListener('click', handleClick, true);
    };
  }, [isEditMode, setSelectedElementId, setPanelAnchor]);

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

        {/* Token assignment button */}
        <button
          type="button"
          onClick={() => setIsEditMode(!isEditMode)}
          className={`h-8 px-4 rounded font-semibold text-[12px] transition-all
            ${
              isEditMode
                ? 'bg-[#6750a4] text-white shadow-lg scale-105'
                : 'bg-white text-[#404050] hover:bg-[#f0f0f0] border border-gray-300'
            }
          `}
        >
          {isEditMode ? '✓ 편집중' : '⚙️ 토큰 할당'}
        </button>
      </div>

      {/* Preview content */}
      <div
        ref={previewRef}
        className="flex-1 overflow-y-auto preview-area relative"
        data-edit-mode={isEditMode ? 'true' : 'false'}
        style={{ WebkitUserSelect: isEditMode ? 'text' : 'none', userSelect: isEditMode ? 'text' : 'none' } as any}
      >
        {activePreviewTab === 'home' && <HomePage />}
        {activePreviewTab === 'components' && <ComponentGallery />}
        {activePreviewTab === 'page' && (
          <div className="p-6 bg-[#f5f5f7]">
            <PageLayout />
          </div>
        )}
        {activePreviewTab === 'modals'     && <ModalPreview />}
        {activePreviewTab === 'typography' && <Typography />}

        {/* Token assignment panel */}
        {selectedElementId && <TokenAssignPanel />}
      </div>
    </div>
  );
}

export default function PreviewCanvas() {
  return (
    <PreviewProvider>
      <PreviewCanvasInner />
    </PreviewProvider>
  );
}
