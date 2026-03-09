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

  // counter used to generate ids for elements that don't already have one
  const autoIdRef = useRef(0);

  useEffect(() => {
    if (!isEditMode || !previewRef.current) return;

    const handleClick = (e: MouseEvent) => {
      // we no longer bail out just because there happens to be a text selection
      // (clicking on a word used to create a small selection, which prevented
      // the panel from opening). instead we let the event through and then
      // clear any selection after capturing the element id below.

      let target = e.target as Node;

      // If target is a text node, get its parent element
      if (target.nodeType === Node.TEXT_NODE) {
        target = target.parentNode as Node;
      }

      // find closest ancestor with an explicit id
      let element = (target as HTMLElement)?.closest('[id]') as HTMLElement | null;
      let elementId: string | null = null;

      if (element) {
        elementId = element.getAttribute('id');
      } else {
        // no id anywhere in the ancestors; use the clicked element itself and
        // give it a generated id so it becomes selectable on future hovers
        const el = target as HTMLElement;
        if (el && el.nodeType === Node.ELEMENT_NODE) {
          if (!el.id) {
            el.id = `preview-auto-${autoIdRef.current++}`;
          }
          elementId = el.id;
        }
      }

      if (elementId) {
        setSelectedElementId(elementId);
        setPanelAnchor({ x: e.clientX, y: e.clientY });

        // remove any accidental text selection so subsequent clicks aren't
        // ignored by the old guard clause logic or user expectations
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
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
        // prevent accidental text selection while editing; crosshair cursor
        style={{ WebkitUserSelect: isEditMode ? 'none' : 'text', userSelect: isEditMode ? 'none' : 'text' } as any}
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
      </div>

      {/* Token assignment panel — outside scroll container */}
      {selectedElementId && <TokenAssignPanel />}
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
