'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useColorStore } from '@/store/colorStore';
import { usePreviewContext } from './PreviewContext';
import { ColorShape } from '@/app/components/ColorShape';
import { hexToOKLCH } from '@/lib/colorUtils';

function toOklchLabel(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)}°`;
}

const COLOR_PROPS = [
  { key: 'background', label: 'Background' },
  { key: 'text',       label: 'Text' },
  { key: 'border',     label: 'Border' },
] as const;

export default function TokenAssignPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const {
    selectedElementId,
    setSelectedElementId,
    selectedColorProp,
    setSelectedColorProp,
    panelAnchor,
    setPanelAnchor,
  } = usePreviewContext();

  const tokens = useColorStore(s => s.tokens);
  const previewAssignments = useColorStore(s => s.previewAssignments);
  const setPreviewAssignment = useColorStore(s => s.setPreviewAssignment);
  const clearPreviewAssignment = useColorStore(s => s.clearPreviewAssignment);
  const useOklch = useColorStore(s => s.useOklch);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

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

  // Assignment key = "elementId:type"
  const assignmentKey = `${selectedElementId}:${selectedColorProp}`;
  const currentAssignmentId = previewAssignments[assignmentKey];

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (tokenId: string) => {
    setPreviewAssignment(assignmentKey, tokenId);
    setSelectedElementId(null);
    setPanelAnchor(null);
  };

  const handleClear = () => {
    clearPreviewAssignment(assignmentKey);
  };

  // Panel position
  const panelWidth = 360;
  const panelHeight = 520;
  const padding = 10;
  let left: number, top: number;

  if (panelAnchor) {
    left = panelAnchor.x + padding;
    top  = panelAnchor.y + padding;
    const vw = window.innerWidth, vh = window.innerHeight;
    if (left + panelWidth  > vw) left = Math.max(padding, vw - panelWidth  - padding);
    if (top  + panelHeight > vh) top  = Math.max(padding, vh - panelHeight - padding);
    if (left < padding) left = padding;
    if (top  < padding) top  = padding;
  } else {
    left = window.innerWidth - panelWidth - 20;
    top  = 80;
  }

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed', left: `${left}px`, top: `${top}px`,
        width: `${panelWidth}px`, maxHeight: `${panelHeight}px`,
        zIndex: 99999, backgroundColor: 'white',
        borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#f8f8f8', borderRadius: '12px 12px 0 0', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>Assign Token</div>
          <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px', fontFamily: 'monospace' }}>
            {selectedElementId}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setSelectedElementId(null); setPanelAnchor(null); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px', fontSize: '14px' }}
        >
          ✕
        </button>
      </div>

      {/* Color property tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '10px 16px',
        borderBottom: '1px solid #e8e8e8', flexShrink: 0,
      }}>
        {COLOR_PROPS.map(({ key, label }) => {
          const isActive = selectedColorProp === key;
          const hasAssignment = !!previewAssignments[`${selectedElementId}:${key}`];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedColorProp(key)}
              style={{
                flex: 1, height: 30, borderRadius: 6, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: isActive ? '#606070' : '#f0f0f0',
                color: isActive ? 'white' : '#666',
                position: 'relative',
              }}
            >
              {label}
              {hasAssignment && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 5, height: 5, borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.7)' : '#8b6fe8',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Current assignment + clear */}
      {currentAssignmentId && (() => {
        const tok = tokens.find(t => t.id === currentAssignmentId);
        if (!tok) return null;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#f0eeff', flexShrink: 0,
          }}>
            <ColorShape color={tok.color} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#606070' }}>{tok.name}</div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#aaa', padding: '2px 4px', flexShrink: 0 }}
            >
              Remove
            </button>
          </div>
        );
      })()}

      {/* Search */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e8e8e8', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '7px 12px', fontSize: '13px',
            border: '1px solid #ddd', borderRadius: '6px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Token list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredTokens.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: '13px', color: '#999' }}>
            No results
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
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  textAlign: 'left', height: '46px', padding: '0 16px',
                  background: isSelected ? '#f0eeff' : 'white',
                  border: 'none', borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  outline: isSelected ? '2px solid #8b6fe8' : 'none',
                  outlineOffset: '-2px',
                }}
              >
                <ColorShape color={token.color} size={40} className="shrink-0"
                  borderColor={isSelected ? '#8b6fe8' : undefined}
                  borderWidth={isSelected ? 2 : undefined}
                />
                <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#333', whiteSpace: 'nowrap' }}>
                      {token.name}
                    </span>
                    {isSelected && <span style={{ fontSize: '10px', color: '#8b6fe8' }}>●</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '11px', color: '#999999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
