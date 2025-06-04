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
      {/* Backdrop overlay to prevent interactions */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* Progress bar */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-96">
        <div className="bg-gray-700/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-600/50">
          <div className="flex items-center justify-between text-white">
            {/* Progress percentage */}
            <div className="text-[#D946EF] font-bold text-lg">
              {Math.round(displayProgress)}%
            </div>
            
            {/* Current step */}
            <div className="text-white text-sm font-medium flex-1 mx-4">
              {currentStep}
            </div>
            
            {/* Time indicator (placeholder) */}
            <div className="text-gray-400 text-sm">
              {isComplete ? 'Done!' : '10s left'}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-gray-600 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-[#D946EF] to-[#c026d3] h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameCreationProgress;
