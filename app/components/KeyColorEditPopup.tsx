'use client';

import { useEffect, useRef, useState } from 'react';
import { hexToHSL } from '@/lib/colorUtils';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';
import { ColorShape } from '@/app/components/ColorShape';
import ColorPicker from '@/app/components/ColorPicker';

interface KeyColorEditPopupProps {
  colorKey: string;
  initialHex: string;
  initialLabel: string;
  initialDescription: string;
  isCore: boolean;
  onSave: (hex: string, label: string, desc: string) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export default function KeyColorEditPopup({
  colorKey,
  initialHex,
  initialLabel,
  initialDescription,
  isCore,
  onSave,
  onClose,
  onRemove,
}: KeyColorEditPopupProps) {
  const [hex,   setHex]   = useState(initialHex);
  const [label, setLabel] = useState(initialLabel);
  const [desc,  setDesc]  = useState(initialDescription);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos,  setPickerPos]  = useState<{ x: number; y: number } | null>(null);

  const popupRef    = useRef<HTMLDivElement>(null);
  const hexInputRef = useRef<HTMLInputElement>(null);

  // sync if parent changes (e.g. switching cards)
  useEffect(() => {
    setHex(initialHex);
    setLabel(initialLabel);
    setDesc(initialDescription);
  }, [colorKey, initialHex, initialLabel, initialDescription]);


  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handlePickerChange = (newHex: string) => {
    setHex(newHex);
    if (hexInputRef.current) hexInputRef.current.value = newHex.toUpperCase();
  };

  const handlePickerClose = (savedHex?: string) => {
    if (savedHex) {
      setHex(savedHex);
      if (hexInputRef.current) hexInputRef.current.value = savedHex.toUpperCase();
    }
    setShowPicker(false);
  };

  const handleHexTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHex(v);
  };

  const handleSave = () => {
    const finalHex = isValidHex(hex) ? normalizeHex(hex) : initialHex;
    const finalLabel = label.trim() || initialLabel;
    onSave(finalHex, finalLabel, desc);
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  const displayHex = isValidHex(hex) ? normalizeHex(hex) : hex;
  const { l } = hexToHSL(displayHex);
  const badgeFg = l > 55 ? '#1a1a1a' : '#ffffff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[10px]">
      <div
        ref={popupRef}
        className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[560px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex h-[70px] items-center justify-between px-6 shrink-0">
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-[16px] text-[#333]">Key Color</p>
            <p className="text-[12px] font-medium text-[#999]">{colorKey}</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex gap-px bg-[#eee] py-px min-h-0">

          {/* Left: swatch */}
          <div className="bg-white flex flex-col items-center justify-start p-6 shrink-0 gap-3">
            <button
              type="button"
              title="클릭하여 색상 선택"
              onClick={e => { setPickerPos({ x: e.clientX, y: e.clientY }); setShowPicker(true); }}
              className="relative w-[120px] h-[120px] overflow-hidden hover:scale-[1.02] transition-transform"
            >
              <ColorShape color={displayHex} size={120} />
              <span
                className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold font-mono tracking-wide"
                style={{ color: badgeFg }}
              >
                {displayHex.toUpperCase()}
              </span>
            </button>
          </div>

          {/* Right: fields */}
          <div className="bg-white flex flex-1 flex-col gap-5 p-6 min-w-0">
            {/* Group name */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Group name</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
                placeholder="e.g. Primary"
              />
            </div>

            {/* Hex value */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Color</label>
              <div className="flex items-center gap-2">
                <ColorShape color={displayHex} size={20} className="shrink-0" />
                <input
                  ref={hexInputRef}
                  type="text"
                  defaultValue={initialHex.toUpperCase()}
                  onChange={handleHexTextChange}
                  maxLength={7}
                  placeholder="#000000"
                  className="flex-1 h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="font-semibold text-[12px] text-[#666]">Description</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Describe the purpose or intent..."
                rows={3}
                className="flex-1 border border-[#ddd] rounded-[10px] px-3 py-2 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none placeholder-[#ccc]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-[70px] items-center justify-between px-[30px] shrink-0">
          <div>
            {!isCore && onRemove && (
              <button
                onClick={handleRemove}
                className="h-9 px-4 bg-[#fff0f0] rounded-[10px] text-[14px] font-medium text-[#e44] hover:bg-[#ffe0e0] transition-colors"
              >
                그룹 삭제
              </button>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="h-9 w-[90px] bg-[#f5f5f5] rounded-[10px] text-[14px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-9 w-[90px] bg-[#666] rounded-[10px] text-[14px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {/* Color Picker 모달 */}
      {showPicker && (
        <div className="fixed inset-0 z-[60]">
          <ColorPicker
            color={isValidHex(hex) ? normalizeHex(hex) : initialHex}
            anchorPos={pickerPos ?? undefined}
            onChange={handlePickerChange}
            onClose={handlePickerClose}
          />
        </div>
      )}
    </div>
  );
}
