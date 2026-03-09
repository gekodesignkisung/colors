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
    if (!isEditMode || !previewRef.current) return;

    let isSelecting = false;

    const handleMouseDown = () => {
      isSelecting = false;
    };

    const handleMouseMove = () => {
      // If user drags, mark as selecting
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        isSelecting = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Check if user just made a text selection
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        isSelecting = true;
      }

      if (isSelecting) {
        isSelecting = false;
        return; // User selected text, don't select element
      }

      const target = e.target as HTMLElement;
      const element = target.closest('[id]') as HTMLElement;
      if (!element) return;

      const elementId = element.getAttribute('id');
      if (elementId) {
        setSelectedElementId(elementId);
        setPanelAnchor({ x: e.clientX, y: e.clientY });
      }
    };

    const preview = previewRef.current;
    preview.addEventListener('mousedown', handleMouseDown);
    preview.addEventListener('mousemove', handleMouseMove);
    preview.addEventListener('mouseup', handleMouseUp);

    return () => {
      preview.removeEventListener('mousedown', handleMouseDown);
      preview.removeEventListener('mousemove', handleMouseMove);
      preview.removeEventListener('mouseup', handleMouseUp);
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
          className={`h-7 px-3 rounded text-[12px] font-medium transition-colors
            ${
              isEditMode
                ? 'bg-[#6750a4] text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }
          `}
        >
          {isEditMode ? '편집 완료' : '토큰 할당'}
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
