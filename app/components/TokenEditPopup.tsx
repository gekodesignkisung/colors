'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { isValidHex, normalizeHex, hexToHSL, hexToOKLCH, generateRandomColor } from '@/lib/colorUtils';
import { applyRule } from '@/lib/generateTokens';
import { TokenOperation, TokenSource, Stage1Op } from '@/types/tokens';
import { ColorShape } from '@/app/components/ColorShape';

/* ─── 소스 선택 옵션 ───────────────────────────────────────── */
const FIXED_SOURCES: { value: string; label: string }[] = [
  { value: 'random', label: 'Random' },
];

interface Stage1Meta { value: Stage1Op; label: string; }
const STAGE1_OPS: Stage1Meta[] = [
  { value: 'source',    label: 'Source'    },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'invert',    label: 'Invert'    },
];

interface Stage2Meta {
  value: TokenOperation;
  label: string;
  hasParam: boolean;
  paramLabel: string;
  defaultParam: number;
}
const STAGE2_OPS: Stage2Meta[] = [
  { value: 'source',        label: 'None',         hasParam: false, paramLabel: '',            defaultParam: 0  },
  { value: 'setLightness',  label: 'Lightness',    hasParam: true,  paramLabel: 'L %',         defaultParam: 50 },
  { value: 'setSaturation', label: 'Saturation',   hasParam: true,  paramLabel: 'S %',         defaultParam: 50 },
  { value: 'colorShift',    label: 'Color Shift',  hasParam: true,  paramLabel: 'Hue shift °', defaultParam: 30 },
  { value: 'lighten',       label: 'Lighten (+)',  hasParam: true,  paramLabel: 'Amount %',    defaultParam: 15 },
  { value: 'darken',        label: 'Darken (-)',   hasParam: true,  paramLabel: 'Amount %',    defaultParam: 15 },
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

const POPUP_W = 820;
const POPUP_H = 520;
const MARGIN  = 12;

function computePos(anchor: { x: number; y: number }) {
  let left = anchor.x + MARGIN;
  let top  = anchor.y + MARGIN;
  if (left + POPUP_W > window.innerWidth  - MARGIN) left = anchor.x - POPUP_W - MARGIN;
  if (top  + POPUP_H > window.innerHeight - MARGIN) top  = anchor.y - POPUP_H - MARGIN;
  return { left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) };
}

export default function TokenEditPopup() {
  const {
    tokens, selectedTokenId, selectedTokenPos, setSelectedToken, updateToken, resetToken,
    baseColors, isDark, groupOrder, groupLabels, useOklch, setDefaultTokenFormula,
  } = useColorStore();

  const SOURCES = [
    ...groupOrder.map(k => ({ value: k, label: groupLabels[k] ?? (k.charAt(0).toUpperCase() + k.slice(1)) })),
    ...FIXED_SOURCES,
  ];

  const token = tokens.find(t => t.id === selectedTokenId);

  const [description,setDescription]= useState('');
  const [mode,       setMode]       = useState<'formula' | 'manual'>('formula');
  const [hexInput,   setHexInput]   = useState('');
  const [showToast,  setShowToast]  = useState(false);

  // Formula editor state
  const [stage1,            setStage1]            = useState<Stage1Op>('source');
  const [operation,         setOperation]         = useState<TokenOperation>('source');
  const [source,            setSource]            = useState<string>('primary');
  const [param,             setParam]             = useState(50);
  const [randomSourceColor, setRandomSourceColor] = useState(() => generateRandomColor());

  const popupRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

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
        setStage1('source');
        const { op, param: p } = getNamingDefaultFormula(
          token.rule.namingType ?? 'background',
          token.rule.namingState ?? 'default',
          token.rule.stateAmount,
        );
        // contrast → stage2 none (legacy)
        setOperation(op === 'contrast' ? 'source' : op);
        setParam(p);
      } else {
        // 기존 수식 또는 커스텀 override
        const s1 = token.rule.stage1 ?? 'source';
        setStage1(s1);
        // legacy invert/grayscale as operation → move to stage1
        if (!token.rule.stage1 && (token.rule.operation === 'invert' || token.rule.operation === 'grayscale')) {
          setStage1(token.rule.operation as Stage1Op);
          setOperation('source');
        } else {
          setOperation(token.rule.operation === 'contrast' ? 'source' : token.rule.operation);
        }
        setSource(token.rule.source);
        setParam(token.rule.param ?? 50);
      }
    }
  }, [token]);

  // Update slider fill via CSS variable (avoids inline style lint warning)
  useEffect(() => {
    if (!sliderRef.current) return;
    const max = operation === 'colorShift' ? 360 : 100;
    sliderRef.current.style.setProperty('--pct', `${(param / max) * 100}%`);
  }, [param, operation]);

  // Auto-hide toast after 2.5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);


  if (!token) return null;

  const isNamingBased = !!(token.rule.namingVariant);
  const currentOp = STAGE2_OPS.find(o => o.value === operation) ?? STAGE2_OPS[0];

  const handleStage2Change = (op: TokenOperation) => {
    setOperation(op);
    const meta = STAGE2_OPS.find(o => o.value === op);
    if (meta?.hasParam) setParam(meta.defaultParam);
  };

  // 'random' 소스 지원: effectiveBaseColors에 random 키 주입
  const effectiveBaseColors = { ...baseColors, random: randomSourceColor };

  /* live colour preview */
  const previewColor =
    mode === 'manual'
      ? (isValidHex(hexInput) ? normalizeHex(hexInput) : token.color)
      : applyRule(
          { stage1, operation, source, param: currentOp.hasParam ? param : undefined, description: '' },
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
          stage1,
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

  const handleSetAsDefault = () => {
    // 현재 편집 내용 저장 (창은 닫지 않음)
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
          stage1,
          operation,
          source,
          param: currentOp.hasParam ? param : undefined,
          description,
          ...(isNamingBased && {
            namingVariant: token.rule.namingVariant,
            namingState:   token.rule.namingState,
            namingType:    token.rule.namingType,
            stateAmount:   token.rule.stateAmount,
          }),
        },
      });
    }
    setDefaultTokenFormula(mode, operation, source, param);
    setShowToast(true);
  };

  const pos = selectedTokenPos ? computePos(selectedTokenPos) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setSelectedToken(null)}>
      <div
        ref={popupRef}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[20px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.12)] w-[820px] flex flex-col overflow-hidden relative"
        style={pos ? { position: 'fixed', left: pos.left, top: pos.top } : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[80px] px-6 shrink-0 border-b border-[#f0f0f0]">
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-[16px] text-[#333]">{token.name}</p>
            <p className="text-[12px] font-medium text-[#999]">{groupLabels[token.group] ?? token.group}</p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setSelectedToken(null)}
            className="w-7 h-7 flex items-center justify-center text-[#808088] hover:text-[#333] transition-colors rounded-full hover:bg-[#f5f5f5]"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3-column body */}
        <div className="flex flex-1 gap-px bg-[#f0f0f0] min-h-0">

          {/* Col 1: Swatch */}
          <div className="bg-white flex flex-col items-center w-[168px] shrink-0 p-6 gap-3">
            <div className="w-[120px] h-[120px]">
              <ColorShape color={previewColor} size={120} radius={60} />
            </div>
            <div className="flex flex-col items-center gap-0.5 w-full">
              {useOklch ? (() => {
                const ok = hexToOKLCH(previewColor);
                return (
                  <>
                    <span className="text-[10px] font-medium text-[#aaa] uppercase tracking-wider">OKLCH</span>
                    <span className="text-[11px] font-semibold font-mono text-[#333] text-center">
                      {(ok.l * 100).toFixed(1)}% {ok.c.toFixed(3)} {ok.h.toFixed(1)}°
                    </span>
                  </>
                );
              })() : (
                <>
                  <span className="text-[10px] font-medium text-[#aaa] uppercase tracking-wider">HEX</span>
                  <span className="text-[11px] font-semibold font-mono text-[#333]">{previewColor.toUpperCase()}</span>
                </>
              )}
            </div>
          </div>

          {/* Col 2: Source color + Description */}
          <div className="bg-white flex flex-col gap-[30px] p-6 w-[315px] shrink-0">
            {/* Source color */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Source color</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <ColorShape
                      color={source === 'random' ? randomSourceColor : (effectiveBaseColors[source as keyof typeof effectiveBaseColors] ?? '#cccccc')}
                      size={12}
                      radius={6}
                    />
                  </span>
                  <select
                    aria-label="Source color"
                    value={source}
                    onChange={e => setSource(e.target.value as TokenSource)}
                    className="w-full h-9 border border-[#dddddd] rounded-[10px] pl-8 pr-8 text-[14px] font-medium text-[#333] bg-white appearance-none outline-none focus:border-[#808088] cursor-pointer"
                  >
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {source === 'random' && (
                  <button
                    type="button"
                    aria-label="새 랜덤 컬러 생성"
                    title="새 랜덤 컬러 생성"
                    onClick={() => setRandomSourceColor(generateRandomColor())}
                    className="shrink-0 w-9 h-9 flex items-center justify-center border border-[#e8e8e8] rounded-[10px] text-[#808088] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 4v6h-6M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

{/* Description */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <label className="font-semibold text-[12px] text-[#666]">Description</label>
              <textarea
                aria-label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="flex-1 border border-[#dddddd] rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-[#333] outline-none focus:border-[#808088] resize-none min-h-0"
              />
            </div>
          </div>

          {/* Col 3: Stage1 + Stage2 + Param + Formula */}
          <div className="bg-white flex flex-1 flex-col gap-5 p-6 min-w-0 overflow-y-auto">

            {/* Stage 1 */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Stage 1</label>
              <div className="flex gap-2">
                {STAGE1_OPS.map(op => (
                  <button
                    type="button"
                    key={op.value}
                    onClick={() => setStage1(op.value)}
                    className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                      stage1 === op.value
                        ? 'bg-[#999999] text-white'
                        : 'bg-white border border-[#ddd] text-[#333] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage 2 */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Stage 2</label>
              <div className="flex flex-col gap-2">
                {STAGE2_OPS.reduce<Stage2Meta[][]>((rows, op, i) => {
                  if (i % 3 === 0) rows.push([op]);
                  else rows[rows.length - 1].push(op);
                  return rows;
                }, []).map((row, ri) => (
                  <div key={ri} className="flex gap-2">
                    {row.map(op => (
                      <button
                        type="button"
                        key={op.value}
                        onClick={() => handleStage2Change(op.value)}
                        className={`flex-1 h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                          operation === op.value
                            ? 'bg-[#999999] text-white'
                            : 'bg-white border border-[#ddd] text-[#333] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Param */}
            <div className={`flex flex-col gap-2 ${!currentOp.hasParam ? 'invisible' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[12px] text-[#666]">{currentOp.paramLabel || 'Param'}</label>
                <div className="flex items-center gap-1">
                  <input
                    aria-label={currentOp.paramLabel || 'Param value'}
                    type="number"
                    min={0}
                    max={operation === 'colorShift' ? 360 : 100}
                    value={param}
                    onChange={e => setParam(Math.max(0, Math.min(operation === 'colorShift' ? 360 : 100, Number(e.target.value))))}
                    className="w-12 text-[12px] font-medium text-[#808088] text-right border border-[#e8e8e8] rounded-[6px] px-1.5 py-0.5 outline-none"
                  />
                  <span className="text-[12px] text-[#aaa]">{operation === 'colorShift' ? '°' : '%'}</span>
                </div>
              </div>
              <input
                ref={sliderRef}
                aria-label={currentOp.paramLabel || 'Param slider'}
                type="range"
                min={0}
                max={operation === 'colorShift' ? 360 : 100}
                value={param}
                onChange={e => setParam(Number(e.target.value))}
                className="param-slider w-full cursor-pointer appearance-none h-[4px] rounded-full"
              />
            </div>

            {/* Formula */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[12px] text-[#666]">Formula</label>
              <div className="h-9 bg-[#f5f5f5] border border-[#dddddd] rounded-[10px] px-3 flex items-center">
                <span className="text-[12px] font-medium text-[#999] font-mono">
                  {(() => {
                    const s1Label = stage1 === 'source' ? source : `${stage1}(${source})`;
                    if (operation === 'source') return `f  ${s1Label}`;
                    const paramStr = currentOp.hasParam ? `, ${param}${operation === 'colorShift' ? '°' : '%'}` : '';
                    return `f  ${operation}(${s1Label}${paramStr})`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between shrink-0 border-t border-[#f0f0f0] p-[24px]">
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-[10px] bg-[#f5f5f5] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#eee]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSetAsDefault}
              className="h-9 px-[10px] bg-[#eef5ff] rounded-[10px] text-[13px] font-medium text-[#7490e7] hover:bg-[#ddeaff]"
            >
              Set Default
            </button>
          </div>
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={() => setSelectedToken(null)}
              className="w-[90px] h-9 bg-[#f5f5f5] rounded-[10px] text-[13px] font-medium text-[#808088] hover:bg-[#eee]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="w-[90px] h-9 bg-[#666666] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#555]"
            >
              Save
            </button>
          </div>
        </div>

        {/* Toast notification */}
        {showToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70]">
            <div className="bg-[#333] text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
              현재 설정이 초기값으로 저장되었습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
