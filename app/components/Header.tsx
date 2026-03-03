'use client';

import { useColorStore } from '@/store/colorStore';

export default function Header() {
  const { isDark, toggleDark, exportCSS, exportJSON } = useColorStore();

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
    <header className="flex items-center justify-between px-5 h-12 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-400" />
        <span className="font-semibold text-gray-900 tracking-tight">colors</span>
        <span className="text-xs text-gray-400 font-normal ml-1">Design Token Generator</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Light / Dark toggle */}
        <button
          onClick={toggleDark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span className="text-gray-600">{isDark ? 'Dark' : 'Light'}</span>
        </button>

        {/* Export CSS */}
        <button
          onClick={downloadCSS}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          CSS
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Export JSON */}
        <button
          onClick={downloadJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          JSON
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </header>
  );
}
