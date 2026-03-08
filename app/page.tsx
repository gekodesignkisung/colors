'use client';

import BaseColorInput from './components/sidebar/BaseColorInput';
import NamingPanel from './components/NamingPanel';
import TokenList from './components/sidebar/TokenList';
import PreviewCanvas from './components/preview/PreviewCanvas';
import TokenEditPopup from './components/TokenEditPopup';
import { useColorStore } from '@/store/colorStore';

export default function Home() {
  const selectedTokenId = useColorStore(s => s.selectedTokenId);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#dddddf', gap: 1 }}>
      {/* Left panel — Key Colors (260px) */}
      <aside style={{ width: 260, flexShrink: 0 }} className="flex flex-col bg-white overflow-hidden">
        <BaseColorInput />
      </aside>

      {/* Naming panel (400px, always visible) */}
      <aside style={{ width: 400, flexShrink: 0 }} className="flex flex-col bg-white overflow-hidden">
        <NamingPanel />
      </aside>

      {/* Middle panel — Generated Colors (360px) */}
      <aside style={{ width: 360, flexShrink: 0 }} className="flex flex-col bg-white overflow-hidden">
        <TokenList />
      </aside>

      {/* Right panel — Preview (fills rest) */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        <PreviewCanvas />
      </main>

      {selectedTokenId && <TokenEditPopup />}
    </div>
  );
}
