import { ImSpinner8 } from "react-icons/im";
import { useEffect, useState } from "react";

interface GameLoadingScreenProps {
  game: {
    title: string;
    thumbnailFile?: {
      s3key: string;
    };
    gameFile?: {
      s3Key: string;
    };
  };
  progress: number;
  onProgress: (progress: number) => void;
}

const GameLoadingScreen = ({
  game,
  progress,
  onProgress,
}: GameLoadingScreenProps) => {
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let slowLoadTimeout: NodeJS.Timeout;

    // Fast progress simulation
    if (progress < 100) {
      progressInterval = setInterval(() => {
        const increment = 5; // Smaller increment for slower progress
        const nextProgress = progress + increment;

        if (nextProgress < 100) {
          onProgress(nextProgress);
        } else {
          clearInterval(progressInterval);
        }
      }, 250);
    }

    // Show slow load message after 10 seconds
    slowLoadTimeout = setTimeout(() => {
      setShowSlowLoadMessage(true);
    }, 3000);

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (slowLoadTimeout) clearTimeout(slowLoadTimeout);
    };
  }, [progress, onProgress]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl"
      style={{
        backgroundImage: game.thumbnailFile?.s3key
          ? `url(${game.thumbnailFile.s3key})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center">
        <ImSpinner8 className="w-16 h-16 text-[#D946EF] animate-spin" />
        <h2 className="mt-4 text-2xl font-dmmono text-white">{game.title}</h2>
        <p className="mt-2 text-[#D946EF]">Getting your game ready...</p>

        {/* Progress Bar */}
        <div className="w-64 h-2 mt-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D946EF] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-white text-sm">{Math.round(progress)}%</p>

        {/* Slow Load Message */}
        {showSlowLoadMessage && (
          <div className="mt-4 text-gray-400 text-sm text-center max-w-md">
            <p>This game is taking longer than usual to load.</p>
            <p>Please be patient or try refreshing the page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLoadingScreen;
