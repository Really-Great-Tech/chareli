import { useEffect, useState } from 'react';

interface GameCreationProgressProps {
  progress: number;
  currentStep: string;
  isComplete?: boolean;
}

const GameCreationProgress = ({ 
  progress, 
  currentStep, 
  isComplete = false 
}: GameCreationProgressProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <>
      {/* Full screen backdrop overlay to cover everything */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
      
      {/* Progress bar */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-96">
        <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-4 shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-gray-900 dark:text-white">
            {/* Progress percentage */}
            <div className="text-[#DC8B18] font-bold text-xl">
              {Math.round(displayProgress)}%
            </div>
            
            {/* Current step */}
            <div className="text-gray-900 dark:text-white text-sm font-medium flex-1 mx-4 text-center">
              {currentStep}
            </div>
            
            {/* Status indicator */}
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {isComplete ? '✓ Done!' : '⏳'}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#DC8B18] to-[#C17600] h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameCreationProgress;
