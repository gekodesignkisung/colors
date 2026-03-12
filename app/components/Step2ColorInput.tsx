import React from 'react';
import BaseColorInput from './BaseColorInput';

type Props = {
  introStep?: number;
  onNext?: () => void;
};

// This wrapper provides an alternate styling/layout for the key-color step
// while leaving the original BaseColorInput component unchanged for use
// elsewhere (e.g. the main workspace page).
export default function Step2ColorInput(props: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.06)] p-6">
        <BaseColorInput {...props} />
      </div>
    </div>
  );
}
