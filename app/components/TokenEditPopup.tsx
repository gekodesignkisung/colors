'use client';

import { useEffect, useRef, useState } from 'react';
import { useColorStore } from '@/store/colorStore';
import { isValidHex, normalizeHex } from '@/lib/colorUtils';

export default function TokenEditPopup() {
  const { tokens, selectedTokenId, setSelectedToken, updateToken, resetToken } = useColorStore();
  const token = tokens.find(t => t.id === selectedTokenId);

  const [name, setName] = useState('');
  const [hexInput, setHexInput] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [paramInput, setParamInput] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      setName(token.name);
      setHexInput(token.color);
      setIsManual(token.isManual);
      setParamInput(token.rule.param !== undefined ? String(token.rule.param) : '');
    }
  }, [token]);

  // Close on outside click
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

  const handleApply = () => {
    const patch: Parameters<typeof updateToken>[1] = { name };
    if (isManual && isValidHex(hexInput)) {
      patch.color = normalizeHex(hexInput);
      patch.isManual = true;
    } else if (!isManual) {
      patch.isManual = false;
    }
    if (paramInput !== '' && !isNaN(Number(paramInput)) && token.rule.param !== undefined) {
      patch.rule = {
        ...token.rule,
        param: Number(paramInput),
        description: token.rule.description.replace(/\d+(?=%\))/, paramInput),
      };
    }
    updateToken(token.id, patch);
    setSelectedToken(null);
  };

  const handleReset = () => {
    resetToken(token.id);
    setSelectedToken(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={popupRef}
        className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Token Settings</h3>
            <p className="text-xs text-gray-400 mt-0.5">{token.group} group</p>
          </div>
          <button
            onClick={() => setSelectedToken(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Color preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border border-black/10 shadow-sm shrink-0"
              style={{ backgroundColor: isManual && isValidHex(hexInput) ? normalizeHex(hexInput) : token.color }}
            />
            <div>
              <div className="text-xs text-gray-500 mb-1">현재 색상</div>
              <div className="text-sm font-mono font-semibold text-gray-800">
                {isManual && isValidHex(hexInput) ? normalizeHex(hexInput) : token.color}
              </div>
            </div>
          </div>

          {/* Token name */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">토큰 이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400 font-mono"
            />
          </div>

          {/* Generation rule */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">생성 규칙</label>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 leading-relaxed">
              <div className="font-mono text-violet-700 mb-1">
                {token.rule.operation}({token.rule.source}
                {token.rule.param !== undefined ? `, ${token.rule.param}%` : ''})
              </div>
              <div className="text-gray-500">{token.rule.description}</div>
            </div>

            {/* Param adjustment */}
            {token.rule.param !== undefined && !token.isManual && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-gray-500 shrink-0">파라미터 조정</label>
                <input
                  type="number"
                  value={paramInput}
                  onChange={e => setParamInput(e.target.value)}
                  min={0} max={100}
                  className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-violet-400 font-mono"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            )}
          </div>

          {/* Manual override */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIsManual(v => !v)}
                className={`w-9 h-5 rounded-full transition-colors ${isManual ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${isManual ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs font-medium text-gray-600">수동 오버라이드</span>
            </label>

            {isManual && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={isValidHex(hexInput) ? normalizeHex(hexInput) : token.color}
                  onChange={e => setHexInput(e.target.value)}
                  className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={hexInput}
                  onChange={e => setHexInput(e.target.value)}
                  maxLength={7}
                  placeholder="#000000"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors mr-auto"
          >
            Reset
          </button>
          <button
            onClick={() => setSelectedToken(null)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
