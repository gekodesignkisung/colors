'use client';

import Header from './components/Header';
import BaseColorInput from './components/sidebar/BaseColorInput';
import TokenList from './components/sidebar/TokenList';
import PreviewCanvas from './components/preview/PreviewCanvas';
import TokenEditPopup from './components/TokenEditPopup';
import { useColorStore } from '@/store/colorStore';

export default function Home() {
  const selectedTokenId = useColorStore(s => s.selectedTokenId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Base Colors panel */}
        <aside className="w-52 flex flex-col border-r border-gray-200 bg-white shrink-0 overflow-hidden">
          <BaseColorInput />
        </aside>

        {/* Generated Tokens panel */}
        <aside className="w-64 flex flex-col border-r border-gray-200 bg-white shrink-0 overflow-hidden">
          <TokenList />
        </aside>

        {/* Main preview */}
        <main className="flex-1 overflow-hidden">
          <PreviewCanvas />
        </main>
      </div>

      {/* Token edit popup */}
      {selectedTokenId && <TokenEditPopup />}
    </div>
  );
}
