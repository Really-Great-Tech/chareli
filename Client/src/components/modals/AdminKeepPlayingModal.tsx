import { useEffect } from 'react';
import { useSystemConfigByKey } from '../../backend/configuration.service';

interface AdminKeepPlayingModalProps {
  open: boolean;
  onClose: () => void;
  isGameLoading?: boolean;
}

export default function AdminKeepPlayingModal({ open, onClose, isGameLoading }: AdminKeepPlayingModalProps) {
  const { data: popupConfig } = useSystemConfigByKey('popup');
  
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open || isGameLoading) return null;

  const title = popupConfig?.value?.title || "Time's Up!";
  const subtitle = popupConfig?.value?.subtitle || "Sign up to keep playing this game and unlock unlimited access to all games!";

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white dark:bg-[#475568] rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 w-[90%] sm:w-[450px] md:w-[500px] lg:w-[550px] max-w-[90vw] border-4 border-[#C026D3]">
        {/* Custom Close Button - Same style as LoginModal */}
        <button
          className="absolute -top-5 -right-5 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={onClose}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>

        <div className="flex flex-col items-center max-w-[90%] mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl tracking-wide font-extrabold mb-3 sm:mb-4 text-[#18181b] dark:text-white text-center">{title}</h1>
          <p className="text-base sm:text-lg lg:text-lg text-center mb-4 sm:mb-6 text-gray-600 dark:text-gray-300">{subtitle}</p>
          <div className='flex items-center justify-center'>
            <button
              onClick={onClose}
              className='bg-[#C026D3] hover:bg-[#a21caf] text-white text-base sm:text-lg lg:text-lg font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors'
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
