'use client';

import { useState } from 'react';
import { useColorStore } from '@/store/colorStore';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export default function Step1CreateProject({ onPrev, onNext }: Props) {
  const setProjectName = useColorStore(s => s.setProjectName);
  const [localName, setLocalName] = useState('');

  const canNext = localName.trim().length > 0;

  return (
    <div className="flex w-full flex-col bg-white overflow-hidden items-center" style={{ paddingTop: 80 }}>
      {/* Main Content Container */}
      <div className="flex flex-col w-[1080px] max-w-full">
        {/* Header Row */}
        <div className="flex w-full items-baseline justify-between pb-2">
          <h1
            className="text-[#333]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '29.05px' }}
          >
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
          <p className="text-[#808090]" style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, lineHeight: '25.2px' }}>
            Enter a name for your new design system project.
          </p>
        </div>

        {/* Input Area (Centered vertically in its block) */}
        <div className="flex w-full justify-center items-center h-[500px]">
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
                  onNext();
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
            onClick={onPrev}
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
              onNext();
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
