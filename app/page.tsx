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
  const setProjectName = useColorStore(s => s.setProjectName);
  const projectName = useColorStore(s => s.projectName);

  // local project name input used during onboarding step -1
  const [localName, setLocalName] = useState(projectName);
  useEffect(() => { setLocalName(projectName); }, [projectName]);

  // onboarding steps:
  // -2 = start/login page
  // -1 = project name entry
  //  0 = key colors
  //  1 = naming
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

  const showNaming = introStep >= 1;
  const showTokenList = introStep >= 2;
  const showPreview = introStep >= 2; // preview appears together with tokens

  // render onboarding screens before workspace
  if (introStep === -2) {
    // enhanced start screen based on Figma example
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#4A90E2] to-[#50E3C2]">
        <div className="bg-white rounded-[30px] shadow-2xl flex flex-col items-center px-16 py-20 max-w-xl w-full">
          <img src="/logo-opencolor.svg" alt="OpenColor" width={220} height={80} />
          <h2 className="mt-8 text-3xl font-extrabold text-gray-800">Welcome to OpenColor</h2>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-sm">
            A simple, perceptually‑accurate color system builder for your design
            projects. Get started by logging in.
          </p>
          <button
            className="mt-12 w-full max-w-xs text-center px-8 py-3 bg-[#4A90E2] text-white rounded-full font-semibold hover:bg-[#356fb9] transition-colors"
            onClick={() => setIntroStep(-1)}
          >
            Log in with Google
          </button>
        </div>
      </div>
    );
  }

  if (introStep === -1) {
    // project name entry
    const canNext = localName.trim().length > 0;
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col px-4">
        <h1 className="text-2xl font-semibold mb-4">Enter project name</h1>
        <input
          value={localName}
          onChange={e => setLocalName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-sm"
        />
        <button
          className={`mt-6 px-6 py-3 rounded-full font-medium ${canNext ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}
          disabled={!canNext}
          onClick={() => {
            setProjectName(localName.trim());
            setIntroStep(0);
          }}
        >
          Next
        </button>
      </div>
    );
  }

  // normal workspace layout for steps 0 and above
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
