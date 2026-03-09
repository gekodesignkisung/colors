'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColorStore } from '@/store/colorStore';
import { usePreviewContext } from './PreviewContext';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';

function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `oklch(${l.toFixed(2)} ${c.toFixed(3)} ${Math.round(h)}°)`;
}

export default function TokenAssignPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    selectedElementId,
    setSelectedElementId,
    panelAnchor,
    setPanelAnchor,
  } = usePreviewContext();

  const tokens = useColorStore(s => s.tokens);
  const previewAssignments = useColorStore(s => s.previewAssignments);
  const setPreviewAssignment = useColorStore(s => s.setPreviewAssignment);
  const useOklch = useColorStore(s => s.useOklch);

  const panelRef = useRef<HTMLDivElement>(null);

  if (!selectedElementId || !panelAnchor) {
    return null;
  }

  const currentAssignmentId = previewAssignments[selectedElementId];

  // Filter tokens by search query
  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (tokenId: string) => {
    setPreviewAssignment(selectedElementId, tokenId);
    handleClose();
  };

  const handleClose = () => {
    setSelectedElementId(null);
    setPanelAnchor(null);
  };

  // Calculate panel position with boundary checks
  const panelWidth = 360;
  const panelHeight = 500;
  const padding = 10;

  let left = panelAnchor.x + padding;
  let top = panelAnchor.y + padding;

  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + panelWidth > viewportWidth) {
      left = Math.max(padding, viewportWidth - panelWidth - padding);
    }
    if (top + panelHeight > viewportHeight) {
      top = Math.max(padding, viewportHeight - panelHeight - padding);
    }
    if (left < padding) left = padding;
    if (top < padding) top = padding;
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedElementId]);

  const panelContent = (
    <div
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-lg border border-[#e0e0e0] flex flex-col"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: '360px',
        maxHeight: '500px',
        zIndex: 10000,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e0e0e0] shrink-0 bg-[#f5f5f5]">
        <div>
          <div className="text-sm font-semibold text-gray-900">토큰 선택</div>
          <div className="text-xs text-gray-500 mt-1">{selectedElementId}</div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-[#e0e0e0] shrink-0">
        <input
          type="text"
          placeholder="🔍 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[#ddd] rounded-lg focus:outline-none focus:border-[#6750a4]"
        />
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTokens.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            검색 결과 없음
          </div>
        ) : (
          filteredTokens.map(token => {
            const isSelected = token.id === currentAssignmentId;
            const colorLabel = useOklch ? toOklchLabel(token.color) : token.color.toUpperCase();
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => handleTokenSelect(token.id)}
                className={`w-full flex items-center text-left h-[46px] px-5 transition-colors
                  ${
                    isSelected
                      ? 'bg-[#f0eeff] outline outline-2 outline-[#8b6fe8] -outline-offset-2'
                      : 'bg-white hover:bg-gray-50'
                  }
                `}
              >
                {/* ColorShape swatch */}
                <ColorShape
                  color={token.color}
                  size={40}
                  className="shrink-0"
                  borderColor={isSelected ? '#8b6fe8' : undefined}
                  borderWidth={isSelected ? 2 : undefined}
                />

                {/* Name + color value (stacked) */}
                <div className="pl-[10px] flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[13px] text-[#333333] whitespace-nowrap">
                      {token.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-[#8b6fe8]">●</span>
                    )}
                  </div>
                  <span className={`font-mono truncate ${useOklch ? 'text-[10px] text-[#a78bfa]' : 'text-[11px] text-[#999999]'}`}>
                    {colorLabel}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
}
