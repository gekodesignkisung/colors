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
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!selectedElementId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelectedElementId(null);
        setPanelAnchor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedElementId, setSelectedElementId, setPanelAnchor]);

  if (!selectedElementId || !mounted) return null;

  const currentAssignmentId = previewAssignments[selectedElementId];

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (tokenId: string) => {
    setPreviewAssignment(selectedElementId, tokenId);
    setSelectedElementId(null);
    setPanelAnchor(null);
  };

  // Panel position
  const panelWidth = 360;
  const panelHeight = 500;
  const padding = 10;

  let left: number;
  let top: number;

  if (panelAnchor) {
    left = panelAnchor.x + padding;
    top = panelAnchor.y + padding;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left + panelWidth > vw) left = Math.max(padding, vw - panelWidth - padding);
    if (top + panelHeight > vh) top = Math.max(padding, vh - panelHeight - padding);
    if (left < padding) left = padding;
    if (top < padding) top = padding;
  } else {
    left = window.innerWidth - panelWidth - 20;
    top = 80;
  }

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${panelWidth}px`,
        maxHeight: `${panelHeight}px`,
        zIndex: 99999,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', borderRadius: '8px 8px 0 0', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>토큰 선택</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{selectedElementId}</div>
        </div>
        <button
          type="button"
          onClick={() => { setSelectedElementId(null); setPanelAnchor(null); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#999', padding: '4px' }}
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="🔍 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Token list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredTokens.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: '13px', color: '#999' }}>검색 결과 없음</div>
        ) : (
          filteredTokens.map(token => {
            const isSelected = token.id === currentAssignmentId;
            const colorLabel = useOklch ? toOklchLabel(token.color) : token.color.toUpperCase();
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => handleTokenSelect(token.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'left',
                  height: '46px',
                  padding: '0 20px',
                  background: isSelected ? '#f0eeff' : 'white',
                  border: 'none',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  outline: isSelected ? '2px solid #8b6fe8' : 'none',
                  outlineOffset: '-2px',
                }}
              >
                <ColorShape
                  color={token.color}
                  size={36}
                  className="shrink-0"
                  borderColor={isSelected ? '#8b6fe8' : undefined}
                  borderWidth={isSelected ? 2 : undefined}
                />
                <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#333', whiteSpace: 'nowrap' }}>
                      {token.name}
                    </span>
                    {isSelected && <span style={{ fontSize: '10px', color: '#8b6fe8' }}>●</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: useOklch ? '10px' : '11px', color: useOklch ? '#a78bfa' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

  return createPortal(panel, document.body);
}
