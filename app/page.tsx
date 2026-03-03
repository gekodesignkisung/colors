'use client';

import BaseColorInput from './components/sidebar/BaseColorInput';
import TokenList from './components/sidebar/TokenList';
import PreviewCanvas from './components/preview/PreviewCanvas';
import TokenEditPopup from './components/TokenEditPopup';
import { useColorStore } from '@/store/colorStore';

export default function Home() {
  const selectedTokenId = useColorStore(s => s.selectedTokenId);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#dddddf', gap: 1 }}>
      {/* Left panel — Key Colors (280px) */}
      <aside style={{ width: 280, flexShrink: 0 }} className="flex flex-col bg-white overflow-hidden">
        <BaseColorInput />
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
