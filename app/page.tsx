'use client';

import { useState, useEffect } from 'react';
import BaseColorInput from './components/BaseColorInput';
import NamingPanel from './components/NamingPanel';
import TokenList from './components/TokenList';
import PreviewCanvas from './components/preview/PreviewCanvas';
import TokenEditPopup from './components/TokenEditPopup';
import StartPage from './components/StartPage';
import Step1CreateProject from './components/onboarding/Step1CreateProject';
import Step2KeyColorsScreen from './components/onboarding/Step2KeyColorsScreen';
import Step3GenerateTokensScreen from './components/onboarding/Step3GenerateTokensScreen';
import { useColorStore } from '@/store/colorStore';

export default function Home() {
  const selectedTokenId = useColorStore(s => s.selectedTokenId);
  const setProjectName = useColorStore(s => s.setProjectName);
  const projectName = useColorStore(s => s.projectName);


  // onboarding steps:
  // -2 = start/login page
  // -1 = project name entry
  //  0 = key colors
  //  1 = generate tokens (Step 3)
  //  2 = token list + preview (main workspace)
  const [introStep, setIntroStep] = useState<number>(-2);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
      const saved = localStorage.getItem('introStep');
      if (saved !== null) {
        const n = parseInt(saved, 10);
        if (!Number.isNaN(n)) setIntroStep(n);
      }
    }
  }, []);

  // persist whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('introStep', introStep.toString());
    }
  }, [introStep]);

  if (!mounted) {
    // avoid hydration mismatch by rendering nothing until client has mounted
    return null;
  }

  const showNaming = true;
  const showTokenList = true;
  const showPreview = true;

  // render onboarding screens before workspace
  if (introStep === -2) {
    return <StartPage onNext={() => setIntroStep(-1)} />;
  }

  if (introStep === -1) {
    return <Step1CreateProject onPrev={() => setIntroStep(-2)} onNext={() => setIntroStep(0)} />;
  }

  if (introStep === 0) {
    return (
      <Step2KeyColorsScreen
        onPrev={() => setIntroStep(-1)}
        onNext={() => setIntroStep(1)}
      />
    );
  }

  if (introStep === 1) {
    return <Step3GenerateTokensScreen onPrev={() => setIntroStep(0)} onNext={() => setIntroStep(2)} />;
  }

  // normal workspace layout for final step
  if (introStep < 2) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#dddddf', gap: 1 }}>
      {/* 4 Pillars in Main Workspace */}
      <aside style={{ flexShrink: 0, width: 300 }} className="flex flex-col bg-white overflow-hidden opacity-100">
        <div className="flex-1 overflow-auto opacity-100">
          <BaseColorInput introStep={introStep} />
        </div>
      </aside>

      <aside style={{ flexShrink: 0, width: 400 }} className="flex flex-col bg-white overflow-hidden opacity-100">
        <div className="flex-1 overflow-auto opacity-100">
          <NamingPanel />
        </div>
      </aside>
      {/* Middle panel — Generated Colors (360px) */}
      <aside
        style={{ flexShrink: 0, width: 360 }}
        className="flex flex-col bg-white overflow-hidden transition-all duration-300 ease-in-out w-[360px] opacity-100"
      >
        <div className="flex-1 overflow-auto transition-opacity duration-300 opacity-100">
          <TokenList />
        </div>
      </aside>

      {/* Right panel — Preview (fills rest) */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden transition-opacity duration-300 opacity-100">
        <PreviewCanvas />
      </main>

      {selectedTokenId && <TokenEditPopup />}
    </div>
  );
}
