'use client';

import { useState, useEffect } from 'react';
import BaseColorInput from './components/sidebar/BaseColorInput';
import NamingPanel from './components/NamingPanel';
import TokenList from './components/sidebar/TokenList';
import PreviewCanvas from './components/preview/PreviewCanvas';
import TokenEditPopup from './components/TokenEditPopup';
import { useColorStore } from '@/store/colorStore';

export default function Home() {
  const selectedTokenId = useColorStore(s => s.selectedTokenId);

  // onboarding steps: 0 = just key colors, 1 = show naming panel, 2 = show token+preview, 3 = done
  // initialize client-side only to avoid SSR errors
  const [introStep, setIntroStep] = useState<number>(0);

  // on mount, reset view step to 0 but keep stored data intact
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIntroStep(0);
    }
  }, []);

  // optionally persist step during session (not needed for refresh reset)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('introStep', introStep.toString());
    }
  }, [introStep]);

  const showNaming = introStep >= 1;
  const showTokenList = introStep >= 2;
  const showPreview = introStep >= 2; // preview appears together with tokens

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#dddddf', gap: 1 }}>
      {/* Left panel — Key Colors (300px) */}
      <aside style={{ width: 300, flexShrink: 0 }} className="flex flex-col bg-white">
        <div className="flex-1 overflow-auto">
          <BaseColorInput
            introStep={introStep}
            onNext={() => setIntroStep(1)}
          />
        </div>
      </aside>

      {/* Naming panel (360px) */}
      <aside
        style={{ flexShrink: 0 }}
        className={
          `flex flex-col bg-white overflow-hidden transition-all duration-300 ease-in-out ` +
          (showNaming
            ? 'w-[360px] opacity-100'
            : 'w-0 opacity-0')
        }
      >
        <div className={`flex-1 overflow-auto transition-opacity duration-300 ${showNaming ? 'opacity-100' : 'opacity-0'}`}>
          <NamingPanel showNext={introStep === 1} onNext={() => setIntroStep(2)} />
        </div>
      </aside>

      {/* Middle panel — Generated Colors (360px) */}
      <aside
        style={{ flexShrink: 0 }}
        className={
          `flex flex-col bg-white overflow-hidden transition-all duration-300 ease-in-out ` +
          (showTokenList
            ? 'w-[360px] opacity-100'
            : 'w-0 opacity-0')
        }
      >
        <div className={`flex-1 overflow-auto transition-opacity duration-300 ${showTokenList ? 'opacity-100' : 'opacity-0'}`}>
          <TokenList showNext={introStep === 2} onNext={() => setIntroStep(3)} />
        </div>
      </aside>

      {/* Right panel — Preview (fills rest) */}
      <main
        className={
          `flex-1 flex flex-col bg-white overflow-hidden transition-opacity duration-300 ` +
          (showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      >
        {showPreview && <PreviewCanvas />}
      </main>

      {selectedTokenId && <TokenEditPopup />}
    </div>
  );
}
