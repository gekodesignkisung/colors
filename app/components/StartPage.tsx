'use client';

import React from 'react';

type Props = {
  onNext: () => void;
};

export default function StartPage({ onNext }: Props) {
  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.stopPropagation();
    // proceed to next step (same as clicking background)
    onNext();
    // TODO: integrate Google OAuth flow here
    console.log('Google login clicked');
  };

  return (
    <div
      className="relative flex h-screen w-full items-center justify-center cursor-pointer transition-colors"
      style={{ backgroundColor: '#404050' }}
      onClick={onNext}
    >
      <div className="flex flex-col items-center justify-center p-[60px] gap-2">
        {/* Logo area */}
        <div className="flex flex-col items-center">
          <img
            src="/logo-opencolor.svg"
            alt="OpenColor"
            style={{ width: 250, height: 'auto', filter: 'brightness(0) invert(1)' }}
            onClick={e => e.stopPropagation()}
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

        {/* Google login button below subtext */}
        <div className="mt-16">
          <button
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 py-3 px-6"
            onClick={handleGoogleLogin}
            style={{ minWidth: 240 }}
          >
            <img src="/icon-google.svg" alt="Google logo" className="h-6 w-6" />
            <span className="text-base font-medium">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
