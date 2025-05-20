// import React from 'react';

interface KeepPlayingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function KeepPlayingModal({ open, onClose }: KeepPlayingModalProps) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
      <div className="relative bg-white dark:bg-[#475568] rounded-2xl shadow-lg p-8 min-w-[350px] max-w-[90vw]">
        <button
          className="absolute -top-5 -right-5 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={onClose}
          aria-label="Close"
          style={{ border: 'none' }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-5xl tracking-wide font-extrabold mb-4 text-[#18181b] dark:text-white">Wanna keep on playing!?</h1>
          <div className='flex items-center justify-center gap-3'>
            <p className='text-[#e87ff8] text-3xl font-extrabold hover:underline'>Sign up</p>
            <p className='text-[#18181b] text-3xl font-bold dark:text-white'>now!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
