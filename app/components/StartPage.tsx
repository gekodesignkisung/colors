'use client';

import React from 'react';

type Props = {
  onNext: () => void;
};

export default function StartPage({ onNext }: Props) {
  return (
    <div
      className="flex h-screen w-full items-center justify-center cursor-pointer transition-colors"
      style={{ backgroundColor: '#404050' }}
      onClick={onNext}
    >
      <div className="flex flex-col items-center justify-center p-[60px] gap-5">
        {/* Logo area */}
        <div className="flex flex-col items-center">
          <img
            src="/logo-opencolor.svg"
            alt="OpenColor"
            style={{ width: 250, height: 'auto', filter: 'brightness(0) invert(1)' }}
          />
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
              opacity: 0.9,
            }}
          >
            AI based oklch color design system generation
          </p>
        </div>
      </div>
    </div>
  );
}
