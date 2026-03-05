'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { isValidHex, normalizeHex, hexToHSL } from '@/lib/colorUtils';
import { applyRule } from '@/lib/generateTokens';
import { TokenOperation, TokenSource } from '@/types/tokens';
import { ColorShape } from '@/app/components/ColorShape';

/* ─── 소스 선택 옵션 ───────────────────────────────────────── */
const FIXED_SOURCES: { value: string; label: string }[] = [
  { value: 'error',  label: 'Error (fixed)'  },
];

interface OpMeta {
  value: TokenOperation;
  label: string;
  hasParam: boolean;
  paramLabel: string;
  defaultParam: number;
}
const OPERATIONS: OpMeta[] = [
  { value: 'source',        label: 'Source',        hasParam: false, paramLabel: '',          defaultParam: 0  },
  { value: 'contrast',      label: 'Contrast',      hasParam: false, paramLabel: '',          defaultParam: 0  },
  { value: 'invert',        label: 'Invert',        hasParam: false, paramLabel: '',          defaultParam: 0  },
  { value: 'setLightness',  label: 'Lightness',     hasParam: true,  paramLabel: 'L %',       defaultParam: 50 },
  { value: 'setSaturation', label: 'Saturation',    hasParam: true,  paramLabel: 'S %',       defaultParam: 50 },
  { value: 'colorShift',    label: 'Color Shift',   hasParam: true,  paramLabel: 'Hue shift °', defaultParam: 30 },
  { value: 'lighten',       label: 'Lighten (+)',    hasParam: true,  paramLabel: 'Amount %',  defaultParam: 15 },
  { value: 'darken',        label: 'Darken (-)',     hasParam: true,  paramLabel: 'Amount %',  defaultParam: 15 },
];

export default function TokenEditPopup() {
  const {
    tokens, selectedTokenId, setSelectedToken, updateToken, resetToken,
    baseColors, isDark, groupOrder, groupLabels, useOklch,
  } = useColorStore();

  // Dynamic source list: all groupOrder keys + error
  const SOURCES = [
    ...groupOrder.map(k => ({ value: k, label: groupLabels[k] ?? (k.charAt(0).toUpperCase() + k.slice(1)) })),
    ...FIXED_SOURCES,
  ];

  const token = tokens.find(t => t.id === selectedTokenId);

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [mode,        setMode]        = useState<'formula' | 'manual'>('formula');
  const [hexInput,    setHexInput]    = useState('');

  // Formula state
  const [operation, setOperation] = useState<TokenOperation>('setLightness');
  const [source,    setSource]    = useState<string>('primary');
  const [param,     setParam]     = useState(50);

  const popupRef = useRef<HTMLDivElement>(null);

  /* sync when selected token changes */
  useEffect(() => {
    if (!token) return;
    setName(token.name);
    setDescription(token.rule.description ?? '');
    setHexInput(token.color);

    if (token.isManual || token.rule.operation === 'fixed' || token.rule.operation === 'manual') {
      setMode('manual');
    } else {
      setMode('formula');
      setOperation(token.rule.operation);
      setSource(token.rule.source);
      setParam(token.rule.param ?? 50);
    }
  }, [token]);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedToken(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setSelectedToken]);

  if (!token) return null;

  const currentOp = OPERATIONS.find(o => o.value === operation) ?? OPERATIONS[0];

  /* when operation changes, reset param to sensible default */
  const handleOpChange = (op: TokenOperation) => {
    setOperation(op);
    const meta = OPERATIONS.find(o => o.value === op);
    if (meta?.hasParam) setParam(meta.defaultParam);
  };

  /* live colour preview */
  const previewColor =
    mode === 'manual'
      ? (isValidHex(hexInput) ? normalizeHex(hexInput) : token.color)
      : applyRule(
          { operation, source, param: currentOp.hasParam ? param : undefined, description: '' },
          baseColors, isDark, useOklch,
        );

  /* badge text colour (auto contrast) */
  const badgeFg = hexToHSL(previewColor).l > 55 ? '#1a1a1a' : '#ffffff';

  const handleApply = () => {
    if (mode === 'manual') {
      updateToken(token.id, {
        name,
        color: isValidHex(hexInput) ? normalizeHex(hexInput) : token.color,
        isManual: true,
        rule: { ...token.rule, operation: 'manual', description },
      });
    } else {
      updateToken(token.id, {
        name,
        color: previewColor,
        isManual: false,
        isFormulaOverride: true,
        rule: {
          operation,
          source,
          param: currentOp.hasParam ? param : undefined,
          description,
        },
      });
    }
    setSelectedToken(null);
  };

  const handleReset = () => {
    resetToken(token.id);
    setSelectedToken(null);
  };

  /* gradient hint bar for setLightness / setSaturation */
  const srcHsl = source in baseColors
    ? hexToHSL(baseColors[source as keyof typeof baseColors])
    : { h: 0, s: 0, l: 50 };
  const gradientBar =
    operation === 'setLightness'
      ? `linear-gradient(to right, hsl(${srcHsl.h},${srcHsl.s}%,0%), hsl(${srcHsl.h},${srcHsl.s}%,100%))`
      : operation === 'setSaturation'
      ? `linear-gradient(to right, hsl(${srcHsl.h},0%,${srcHsl.l}%), hsl(${srcHsl.h},100%,${srcHsl.l}%))`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[10px]">
      <div
        ref={popupRef}
        className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.1)] w-[820px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex h-[80px] items-center justify-between px-6 shrink-0">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-[16px] text-[#333]">Creation rules for this color</p>
            <div className="flex gap-2 text-[12px] font-medium text-[#999]">
              <span>{token.group}</span>
              <span>\</span>
              <span>{token.name}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedToken(null)}
            className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3-column body — separated by 1px #eee gaps */}
        <div className="flex flex-1 gap-px bg-[#eee] py-px min-h-0">

          {/* Left: color swatch */}
          <div className="bg-white flex flex-col p-6 shrink-0">
            <div className="relative w-[120px] h-[120px] overflow-hidden">
              <ColorShape color={previewColor} size={120} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <span className="text-[12px] font-semibold font-mono tracking-wide leading-none" style={{ color: badgeFg }}>{previewColor}</span>
                {(token.isManual || token.isFormulaOverride) && (
                  <span className="text-[11px] opacity-70 leading-none" style={{ color: badgeFg }}>
                    {token.isManual ? 'Manual' : 'Modified'}
                  </span>
                )}
              </div>
              {mode === 'manual' && (
                <input
                  type="color"
                  value={isValidHex(hexInput) ? normalizeHex(hexInput) : token.color}
                  onChange={e => setHexInput(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Click to pick color"
                />
              )}
            </div>
          </div>

          {/* Middle: edit mode / source / operation */}
          <div className="relative bg-white flex flex-1 flex-col gap-5 p-6 min-w-0">

            {/* Edit mode */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[12px] text-[#666]">Edit mode</span>
              <div className="relative w-[160px]">
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as 'formula' | 'manual')}
                  className="w-full h-9 border border-[#ddd] rounded-[10px] px-3 pr-8 text-[14px] font-medium text-[#333] bg-white appearance-none outline-none focus:border-[#808088] cursor-pointer"
                >
                  <option value="formula">Formula</option>
                  <option value="manual">Manual</option>
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Formula content — always rendered to fix height; invisible in manual mode */}
            <div className={`flex flex-col gap-5 ${mode === 'manual' ? 'invisible' : ''}`}>
                {/* Source color */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Source color</label>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      <ColorShape color={baseColors[source as keyof typeof baseColors] ?? '#cccccc'} size={12} />
                    </span>
                    <select
                      value={source}
                      onChange={e => setSource(e.target.value as TokenSource)}
                      className="w-full h-9 border border-[#ddd] rounded-[10px] pl-8 pr-8 text-[14px] font-medium text-[#333] bg-white appearance-none outline-none focus:border-[#808088] cursor-pointer"
                    >
                      {SOURCES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Operation */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Operation</label>
                  <div className="flex flex-col gap-2">
                    {OPERATIONS.reduce<OpMeta[][]>((rows, op, i) => {
                      if (i % 3 === 0) rows.push([op]);
                      else rows[rows.length - 1].push(op);
                      return rows;
                    }, []).map((row, ri) => (
                      <div key={ri} className="flex gap-2">
                        {row.map(op => (
                          <button
                            key={op.value}
                            onClick={() => handleOpChange(op.value)}
                            className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                              operation === op.value
                                ? 'bg-[#808088] text-white'
                                : 'bg-white border border-[#ddd] text-[#333] hover:bg-gray-50'
                            }`}
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Param slider — always reserve space even when no param */}
                <div className={`flex flex-col gap-2 ${!currentOp.hasParam ? 'invisible' : ''}`}>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[12px] text-[#666]">{currentOp.paramLabel || 'Param'}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min={0} max={operation === 'colorShift' ? 360 : 100} value={param}
                        onChange={e => setParam(Math.max(0, Math.min(operation === 'colorShift' ? 360 : 100, Number(e.target.value))))}
                        className="w-12 text-[12px] font-medium text-[#808088] text-right border border-[#ddd] rounded-[6px] px-1.5 py-0.5 outline-none"
                      />
                      <span className="text-[12px] text-[#999]">{operation === 'colorShift' ? '\u00b0' : '%'}</span>
                    </div>
                  </div>
                  {gradientBar
                    ? <div className="h-1.5 rounded-full border border-black/8" style={{ background: gradientBar }} />
                    : <div className="h-1.5" />
                  }
                  <input
                    type="range" min={0} max={operation === 'colorShift' ? 360 : 100} value={param}
                    onChange={e => setParam(Number(e.target.value))}
                    className="w-full accent-[#808088] h-1.5"
                  />
                </div>

                {/* Formula read-only display */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Formula</label>
                  <div className="h-9 bg-[#f5f5f5] border border-[#ddd] rounded-[10px] px-3 flex items-center">
                    <span className="text-[12px] font-medium text-[#999]">
                      f&nbsp;&nbsp;{operation}({source}{currentOp.hasParam ? `, ${param}${operation === 'colorShift' ? '\u00b0' : '%'}` : ''})
                    </span>
                  </div>
                </div>
            </div>

            {/* Manual mode overlay — absolutely positioned, only visible in manual mode */}
            {mode === 'manual' && (
              <div className="absolute top-[80px] left-0 right-0 bottom-0 flex flex-col gap-5 px-6 pb-6 bg-white">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[12px] text-[#666]">Color</label>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={e => setHexInput(e.target.value)}
                    maxLength={7}
                    placeholder="#000000"
                    className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] font-mono"
                  />
                </div>
                <div className="bg-[#f5f5f5] border border-[#ddd] rounded-[10px] px-3 py-2.5">
                  <div className="text-[12px] font-medium text-[#999]">
                    {token.rule.operation}({token.rule.source}{token.rule.param !== undefined ? `, ${token.rule.param}%` : ''})
                  </div>
                  <div className="text-[11px] text-[#bbb] mt-1">Original rule</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: token name + description */}
          <div className="bg-white flex flex-1 flex-col gap-[30px] p-6 min-w-0 min-h-0">
            {/* Token name */}
            <div className="flex flex-col gap-2 shrink-0">
              <label className="font-semibold text-[12px] text-[#666]">Token name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9 border border-[#ddd] rounded-[10px] px-3 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088]"
              />
            </div>
            {/* Description */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <label className="font-semibold text-[12px] text-[#666]">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the purpose or intent..."
                className="flex-1 border border-[#ddd] rounded-[10px] px-3 py-2 text-[14px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none placeholder-[#ccc]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex h-[80px] items-center justify-between px-[30px] shrink-0">
          <button
            onClick={handleReset}
            className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={() => setSelectedToken(null)}
              className="h-9 w-[100px] bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="h-9 w-[100px] bg-[#666] rounded-[10px] text-[15px] font-medium text-white hover:bg-[#555] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
