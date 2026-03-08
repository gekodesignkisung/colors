'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { isValidHex, normalizeHex, hexToHSL, generateRandomColor } from '@/lib/colorUtils';
import { applyRule, getStateDescription, getTypeDescription } from '@/lib/generateTokens';
import { TokenOperation, TokenSource } from '@/types/tokens';
import { ColorShape } from '@/app/components/ColorShape';
import ColorPicker from '@/app/components/ColorPicker';

/* ─── 소스 선택 옵션 ───────────────────────────────────────── */
const FIXED_SOURCES: { value: string; label: string }[] = [
  { value: 'random', label: 'Random' },
];

interface OpMeta {
  value: TokenOperation;
  label: string;
  hasParam: boolean;
  paramLabel: string;
  defaultParam: number;
}
const OPERATIONS: OpMeta[] = [
  { value: 'source',        label: 'Source',       hasParam: false, paramLabel: '',            defaultParam: 0  },
  { value: 'contrast',      label: 'Contrast',     hasParam: false, paramLabel: '',            defaultParam: 0  },
  { value: 'invert',        label: 'Invert',       hasParam: false, paramLabel: '',            defaultParam: 0  },
  { value: 'setLightness',  label: 'Lightness',    hasParam: true,  paramLabel: 'L %',         defaultParam: 50 },
  { value: 'setSaturation', label: 'Saturation',   hasParam: true,  paramLabel: 'S %',         defaultParam: 50 },
  { value: 'colorShift',    label: 'Color Shift',  hasParam: true,  paramLabel: 'Hue shift °', defaultParam: 30 },
  { value: 'lighten',       label: 'Lighten (+)',   hasParam: true,  paramLabel: 'Amount %',   defaultParam: 15 },
  { value: 'darken',        label: 'Darken (-)',    hasParam: true,  paramLabel: 'Amount %',   defaultParam: 15 },
];

/** 네이밍 기반 토큰의 type+state → 편집기 초기 operation/param */
function getNamingDefaultFormula(
  namingType: string,
  namingState: string,
  stateAmount?: number,
): { op: TokenOperation; param: number } {
  if (namingType === 'text' || namingType === 'icon') {
    return { op: 'contrast', param: 0 };
  }
  if (namingType === 'border') {
    return { op: 'setLightness', param: 75 };
  }
  if (namingState === 'hover')   return { op: 'lighten', param: stateAmount ?? 8  };
  if (namingState === 'pressed') return { op: 'darken',  param: stateAmount ?? 10 };
  return { op: 'source', param: 0 };
}

export default function TokenEditPopup() {
  const {
    tokens, selectedTokenId, setSelectedToken, updateToken, resetToken,
    baseColors, isDark, groupOrder, groupLabels, useOklch,
  } = useColorStore();

  const SOURCES = [
    ...groupOrder.map(k => ({ value: k, label: groupLabels[k] ?? (k.charAt(0).toUpperCase() + k.slice(1)) })),
    ...FIXED_SOURCES,
  ];

  const token = tokens.find(t => t.id === selectedTokenId);

  const [description,setDescription]= useState('');
  const [mode,       setMode]       = useState<'formula' | 'manual'>('formula');
  const [hexInput,   setHexInput]   = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos,  setPickerPos]  = useState<{ x: number; y: number } | null>(null);

  // Formula editor state
  const [operation,         setOperation]         = useState<TokenOperation>('setLightness');
  const [source,            setSource]            = useState<string>('primary');
  const [param,             setParam]             = useState(50);
  const [randomSourceColor, setRandomSourceColor] = useState(() => generateRandomColor());

  const popupRef = useRef<HTMLDivElement>(null);

  /* sync when selected token changes */
  useEffect(() => {
    if (!token) return;
    setDescription(token.rule.description ?? '');
    setHexInput(token.color);

    if (token.isManual || token.rule.operation === 'fixed' || token.rule.operation === 'manual') {
      setMode('manual');
    } else {
      setMode('formula');
      if (token.rule.namingVariant && !token.isFormulaOverride) {
        // 네이밍 기반 + 미수정: type/state 기반으로 편집기 초기값 결정
        setSource(token.rule.namingVariant);
        const { op, param: p } = getNamingDefaultFormula(
          token.rule.namingType ?? 'background',
          token.rule.namingState ?? 'default',
          token.rule.stateAmount,
        );
        setOperation(op);
        setParam(p);
      } else {
        // 기존 수식 또는 커스텀 override
        setOperation(token.rule.operation);
        setSource(token.rule.source);
        setParam(token.rule.param ?? 50);
      }
    }
  }, [token]);


  if (!token) return null;

  const isNamingBased = !!(token.rule.namingVariant);
  const currentOp = OPERATIONS.find(o => o.value === operation) ?? OPERATIONS[0];

  const handleOpChange = (op: TokenOperation) => {
    setOperation(op);
    const meta = OPERATIONS.find(o => o.value === op);
    if (meta?.hasParam) setParam(meta.defaultParam);
  };

  // 'random' 소스 지원: effectiveBaseColors에 random 키 주입
  const effectiveBaseColors = { ...baseColors, random: randomSourceColor };

  /* live colour preview */
  const previewColor =
    mode === 'manual'
      ? (isValidHex(hexInput) ? normalizeHex(hexInput) : token.color)
      : applyRule(
          { operation, source, param: currentOp.hasParam ? param : undefined, description: '' },
          effectiveBaseColors, isDark, useOklch,
        );

  const badgeDark = hexToHSL(previewColor).l > 55;

  const handleApply = () => {
    if (mode === 'manual') {
      updateToken(token.id, {
        color: isValidHex(hexInput) ? normalizeHex(hexInput) : token.color,
        isManual: true,
        rule: { ...token.rule, operation: 'manual', description },
      });
    } else {
      updateToken(token.id, {
        color: previewColor,
        isManual: false,
        isFormulaOverride: true,
        rule: {
          operation,
          source,
          param: currentOp.hasParam ? param : undefined,
          description,
          // 네이밍 메타 유지 (Reset 시 복원 기준)
          ...(isNamingBased && {
            namingVariant: token.rule.namingVariant,
            namingState:   token.rule.namingState,
            namingType:    token.rule.namingType,
            stateAmount:   token.rule.stateAmount,
          }),
        },
      });
    }
    setSelectedToken(null);
  };

  const handleReset = () => {
    resetToken(token.id);
    // 창은 유지 — token 변경 시 useEffect가 로컬 상태를 자동 동기화
  };


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
              <span>{token.name}</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setSelectedToken(null)}
            className="w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#333] transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3-column body */}
        <div className="flex flex-1 gap-px bg-[#eee] py-px min-h-0">

          {/* Left: color swatch */}
          <div className="bg-white flex flex-col p-6 shrink-0">
            <div
              className={`relative w-[120px] h-[120px] overflow-hidden ${mode === 'manual' ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
              onClick={e => { if (mode === 'manual') { setPickerPos({ x: e.clientX, y: e.clientY }); setShowPicker(true); } }}
              title={mode === 'manual' ? '클릭하여 색상 선택' : undefined}
            >
              <ColorShape color={previewColor} size={120} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <span className={`text-[12px] font-semibold font-mono tracking-wide leading-none ${badgeDark ? 'text-[#1a1a1a]' : 'text-white'}`}>{previewColor}</span>
                {(token.isManual || token.isFormulaOverride) && (
                  <span className={`text-[11px] opacity-70 leading-none ${badgeDark ? 'text-[#1a1a1a]' : 'text-white'}`}>
                    {token.isManual ? 'Manual' : 'Modified'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle: formula editor */}
          <div className="relative bg-white flex flex-1 flex-col gap-5 p-6 min-w-0">

            {/* Auto-generation context (naming-based only) */}
            {isNamingBased && (
              <div className="flex items-center gap-1.5 bg-[#f5f5f5] border border-[#eee] rounded-[10px] px-3 h-8 text-[11px]">
                <span className="font-semibold text-[#808088]">Auto</span>
                <span className="text-[#ccc]">·</span>
                <span className="font-medium text-[#333]">{token.rule.namingVariant}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#ccc] shrink-0"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[#333]">{getStateDescription(token.rule.namingState!, token.rule.stateAmount)}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#ccc] shrink-0"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[#333]">{token.rule.namingType}</span>
                <span className="text-[#bbb] ml-1 italic">{getTypeDescription(token.rule.namingType!)}</span>
                {token.isFormulaOverride && (
                  <span className="ml-auto text-[10px] font-semibold text-[#f59e0b] bg-[#fef3c7] px-1.5 py-0.5 rounded-[4px]">Modified</span>
                )}
              </div>
            )}

            {/* Edit mode selector */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[12px] text-[#666]">Edit mode</span>
              <div className="relative w-[160px]">
                <select
                  aria-label="Edit mode"
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <ColorShape
                        color={source === 'random' ? randomSourceColor : (effectiveBaseColors[source as keyof typeof effectiveBaseColors] ?? '#cccccc')}
                        size={12}
                      />
                    </span>
                    <select
                      aria-label="Source color"
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
                  {source === 'random' && (
                    <button
                      type="button"
                      aria-label="새 랜덤 컬러 생성"
                      title="새 랜덤 컬러 생성"
                      onClick={() => setRandomSourceColor(generateRandomColor())}
                      className="shrink-0 w-9 h-9 flex items-center justify-center border border-[#ddd] rounded-[10px] text-[#808088] hover:bg-gray-50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                      </svg>
                    </button>
                  )}
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
                          type="button"
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

              {/* Param slider */}
              <div className={`flex flex-col gap-2 ${!currentOp.hasParam ? 'invisible' : ''}`}>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[12px] text-[#666]">{currentOp.paramLabel || 'Param'}</label>
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={currentOp.paramLabel || 'Param value'}
                      type="number" min={0} max={operation === 'colorShift' ? 360 : 100} value={param}
                      onChange={e => setParam(Math.max(0, Math.min(operation === 'colorShift' ? 360 : 100, Number(e.target.value))))}
                      className="w-12 text-[12px] font-medium text-[#808088] text-right border border-[#ddd] rounded-[6px] px-1.5 py-0.5 outline-none"
                    />
                    <span className="text-[12px] text-[#999]">{operation === 'colorShift' ? '\u00b0' : '%'}</span>
                  </div>
                </div>
                <input
                  aria-label={currentOp.paramLabel || 'Param slider'}
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

            {/* Manual mode overlay */}
            {mode === 'manual' && (
              <div className="absolute top-[calc(80px_+_40px)] left-0 right-0 bottom-0 flex flex-col gap-5 px-6 pb-6 bg-white">
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
                  {isNamingBased ? (
                    <div className="text-[12px] font-medium text-[#999]">
                      {token.rule.namingVariant} → {getStateDescription(token.rule.namingState!, token.rule.stateAmount)} → {token.rule.namingType}
                    </div>
                  ) : (
                    <div className="text-[12px] font-medium text-[#999]">
                      {token.rule.operation}({token.rule.source}{token.rule.param !== undefined ? `, ${token.rule.param}%` : ''})
                    </div>
                  )}
                  <div className="text-[11px] text-[#bbb] mt-1">Original rule</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: description only */}
          <div className="bg-white flex flex-1 flex-col gap-[30px] p-6 min-w-0 min-h-0">
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

        {/* Color Picker */}
        {showPicker && (
          <div className="fixed inset-0 z-[60]">
            <ColorPicker
              color={isValidHex(hexInput) ? normalizeHex(hexInput) : token.color}
              anchorPos={pickerPos ?? undefined}
              onChange={newHex => setHexInput(newHex)}
              onClose={savedHex => {
                if (savedHex) setHexInput(savedHex);
                setShowPicker(false);
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex h-[80px] items-center justify-between px-[30px] shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-4 bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedToken(null)}
              className="h-9 w-[100px] bg-[#f5f5f5] rounded-[10px] text-[15px] font-medium text-[#808088] hover:bg-[#eee] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
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
