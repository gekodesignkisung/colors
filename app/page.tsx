'use client';

import { useState, useEffect } from 'react';
import BaseColorInput from './components/sidebar/BaseColorInput';
import NamingPanel from './components/NamingPanel';
import TokenList from './components/sidebar/TokenList';
import PreviewCanvas from './components/preview/PreviewCanvas';
import TokenEditPopup from './components/TokenEditPopup';
import Step2KeyColorsScreen from './components/onboarding/Step2KeyColorsScreen';
import Step3GenerateTokensScreen from './components/onboarding/Step3GenerateTokensScreen';
import { useColorStore } from '@/store/colorStore';

export default function Home() {
  const selectedTokenId = useColorStore(s => s.selectedTokenId);
  const setProjectName = useColorStore(s => s.setProjectName);
  const projectName = useColorStore(s => s.projectName);

  // local project name input used during onboarding step -1
  const [localName, setLocalName] = useState('');

  // onboarding steps:
  // -2 = start/login page
  // -1 = project name entry
  //  0 = key colors
  //  1 = generate tokens (Step 3)
  //  2 = token list + preview (main workspace)
  const [introStep, setIntroStep] = useState<number>(-2);

  // on mount initialise step (could read from storage if desired)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIntroStep(-2);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('introStep', introStep.toString());
    }
  }, [introStep]);

  const showNaming = true;
  const showTokenList = true;
  const showPreview = true;

  // render onboarding screens before workspace
  if (introStep === -2) {
    // Figma step: "home" (57:45)
    // Dark background #404050, centered logo and subtext
    return (
      <div
        className="flex h-screen w-full items-center justify-center cursor-pointer transition-colors"
        style={{ backgroundColor: '#404050' }}
        onClick={() => setIntroStep(-1)}
      >
        <div className="flex flex-col items-center justify-center p-[60px] gap-5">
          {/* Logo area */}
          <div className="flex flex-col items-center">
            <img src="/logo-opencolor.svg" alt="OpenColor" style={{ width: 250, height: 'auto', filter: 'brightness(0) invert(1)' }} />
          </div>

          {/* Subtext */}
          <div className="mt-8">
            <p
              className="text-white uppercase text-left"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 14,
                letterSpacing: 0,
                lineHeight: '16.94px',
                opacity: 0.9
              }}
            >
              AI based oklch color design system generation
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (introStep === -1) {
    // project name entry
    const canNext = localName.trim().length > 0;
    return (
      <div className="flex h-screen w-full flex-col bg-white overflow-hidden items-center" style={{ paddingTop: 80 }}>
        {/* Main Content Container */}
        <div className="flex flex-col w-[1080px] max-w-full">
          
          {/* Header Row */}
          <div className="flex w-full items-center justify-between pb-2">
            <h1 className="text-[#333]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '29.05px' }}>
              Step 1 . Create Project
            </h1>
            <div className="flex items-center w-[120px] h-[50px]">
              <img src="/logo-opencolor-s.svg" alt="OpenColor" style={{ width: '100%', height: 'auto' }} />
            </div>
          </div>

          {/* Top Divider */}
          <div className="w-full h-[2px] bg-[#404050]"></div>

          {/* Subtitle */}
          <div className="pt-3">
            <p className="text-[#808090]" style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, lineHeight: '25.2px' }}>
              Enter a name for your new design system project.
            </p>
          </div>

          {/* Input Area (Centered vertically in its block) */}
          <div className="flex w-full justify-center items-center h-[350px]">
             <div className="flex items-center justify-between w-[400px] h-[50px] border border-[#808090] rounded-[50px] px-5 bg-white">
                <input
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  placeholder="Enter your project name"
                  className="w-full h-full bg-transparent outline-none text-[#333] placeholder-[#ccc]"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 18 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && canNext) {
                      setProjectName(localName.trim());
                      setIntroStep(0);
                    }
                  }}
                />
             </div>
          </div>
        </div>

        {/* Bottom Nav Area */}
        <div className="flex flex-col w-[1080px] max-w-full grow justify-end pb-[60px]">
          <div className="flex items-center w-full h-[50px]">
            {/* Prev Button */}
            <button
              className="flex items-center justify-center w-[120px] h-full rounded-[50px] border-[2px] border-[#404050] bg-white text-[#404050] transition-colors hover:bg-gray-50 cursor-pointer"
              onClick={() => setIntroStep(-2)}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 18, lineHeight: '21.78px' }}>
                Prev.
              </span>
            </button>
            {/* The line taking remaining space */}
            <div className="h-[2px] bg-[#404050] flex-1 mx-0"></div>
            {/* Next Button */}
            <button
              className={`flex items-center justify-center w-[120px] h-full rounded-[50px] transition-colors ${canNext ? 'bg-[#404050] text-white cursor-pointer' : 'bg-[#808090] text-[#b4b4be] cursor-not-allowed'}`}
              disabled={!canNext}
              onClick={() => {
                setProjectName(localName.trim());
                setIntroStep(0);
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 18, lineHeight: '21.78px' }}>
                Next
              </span>
            </button>
          </div>
        </div>
      </div>
    );
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

      <aside style={{ flexShrink: 0, width: 360 }} className="flex flex-col bg-white overflow-hidden opacity-100">
        <div className="flex-1 overflow-auto opacity-100">
          <NamingPanel />
        </div>
      </aside>
      {/* Middle panel — Generated Colors (360px) */}
      <aside
        style={{ flexShrink: 0 }}
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
