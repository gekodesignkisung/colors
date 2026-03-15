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

  // When entering edit mode we also walk the tree and give ids to
  // any elements that contain text but don’t already have one. this makes
  // it easier to pick the correct token (e.g. button labels) without
  // manually wrapping every piece in a span.
  useEffect(() => {
    if (!isEditMode || !previewRef.current) return;

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();

      let target = e.target as HTMLElement | null;
      if (!target) return;

      // If a text node was clicked, use its parent element
      if ((target as unknown as Node).nodeType === Node.TEXT_NODE) {
        target = (target as unknown as Text).parentElement;
      }
      if (!target) return;

      // Find nearest ancestor (or self) with data-color-el attribute
      // This is the only reliable way to find color-assignable elements
      const colorEl = target.closest('[data-color-el]') as HTMLElement | null;
      const elementId = colorEl?.getAttribute('data-color-el') ?? null;

      if (elementId) {
        setSelectedElementId(elementId);
        setPanelAnchor({ x: e.clientX, y: e.clientY });
        window.getSelection()?.removeAllRanges();
      }
    };

    const preview = previewRef.current;
    preview.addEventListener('click', handleClick, true);
    return () => preview.removeEventListener('click', handleClick, true);
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
      <div className="flex items-center justify-between shrink-0 h-14 px-[20px] bg-[rgba(128,128,144,0.8)]">
        {/* TAB BUTTONS — commented out, do not delete
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
        */}

        {/* Left: title */}
        <span className="font-semibold text-[16px] text-white">Preview Template</span>

        {/* Right: token assign button */}
        <button
          type="button"
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-0 h-[30px] transition-all ${isEditMode ? 'opacity-80' : 'hover:opacity-80'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-colorpicker.svg" alt="" width={30} height={30} aria-hidden="true" />
          <span className="font-medium text-[14px] text-white">
            {isEditMode ? 'Save' : 'Edit Colors'}
          </span>
        </button>
      </div>

      {/* Preview content */}
      <div
        ref={previewRef}
        className="flex-1 overflow-y-auto preview-area relative"
        data-edit-mode={isEditMode ? 'true' : 'false'}
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
