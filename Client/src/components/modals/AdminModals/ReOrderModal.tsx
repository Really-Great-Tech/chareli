import { useState, useEffect } from 'react';
import { FaArrowRight } from "react-icons/fa6";
import { useGameByPosition, useUpdateGamePosition } from '../../../backend/games.service';

interface ReOrderModalProps {
  onOpenChange: (open: boolean) => void;
  game: {
    id: string;
    title: string;
    category?: { id: string; name: string } | null;
    thumbnailFile?: { url: string } | null;
  } | null;
}

export default function ReOrderModal({ onOpenChange, game }: ReOrderModalProps) {
  const [positionInput, setPositionInput] = useState<string>('');
  const [targetPosition, setTargetPosition] = useState<number | null>(null);

  const { data: gameByPosition, isLoading: isLoadingGameByPosition } = useGameByPosition(targetPosition as number);
  const { mutate: updateGamePosition } = useUpdateGamePosition();

  useEffect(() => {
    if (positionInput) {
      const parsedPosition = parseInt(positionInput);
      if (!isNaN(parsedPosition) && parsedPosition > 0) {
        setTargetPosition(parsedPosition);
      } else {
        setTargetPosition(null);
      }
    } else {
      setTargetPosition(null);
    }
  }, [positionInput]);

  if (!game) {
    return null;
  }

  const handleReorder = () => {
    if (game && targetPosition) {
      updateGamePosition({ id: game.id, position: targetPosition });
      onOpenChange(false); // Close modal after reorder
    }
  };

  const displayGame = gameByPosition || null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      
      <div className="relative bg-white dark:bg-[#334154] rounded-lg shadow-md p-6 max-w-xl">
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <h2 className="text-2xl font-semibold text-[#0F1621] dark:text-white mb-2">Reorder Game</h2>
        <p className="text-gray-700 text-sm mb-4 dark:text-white">
          The new order number will be swapped with the existing number if already taken. This action can be reversed.
        </p>
        <div className="flex justify-between items-center mb-8">
          <div className="flex">
          <img
            src={game.thumbnailFile?.url || ""}
            alt={game.title}
            className="h-20 w-20 rounded-md mr-4"
          />
            <div className='mt-4'>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">{game.title}</h3>
            <p className="text-gray-600 text-sm dark:text-white">{game.category?.name || "Uncategorized"}</p>
          </div>
          </div>
          <div className="items-center">
            <input
              type="text"
              placeholder="#1"
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              className="border border-gray-300 rounded-md p-2 mr-2 w-20 text-center bg-[#F1F5F9] dark:bg-[#64748A] placeholder placeholder:text-[#121C2D] dark:placeholder:text-white"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mb-8 w-full">
          <div className="bg-gray-200 dark:bg-[#64748A] rounded-md p-4 flex flex-col items-start flex-1 mr-4">
            <span className="text-lg font-bold text-[#0F1621] dark:text-white mb-2">Current Position</span>
            <div className="flex">
              <img
                src={game.thumbnailFile?.url || ""}
                alt={game.title}
                className="h-20 w-20 rounded-md mr-4"
              />
              <div className='mt-4'>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">{game.title}</h3>
                <p className="text-gray-600 text-sm dark:text-white">{game.category?.name || "Uncategorized"}</p>
              </div>
            </div>
          </div>
          <FaArrowRight className="w-6 h-6 text-[#0F1621] dark:text-white " />
          <div className="bg-gray-200 dark:bg-[#64748A] rounded-md p-4 flex flex-col items-start flex-1 ml-4">
            <span className="text-lg font-bold text-[#0F1621] dark:text-white mb-2">
              {targetPosition ? `#${targetPosition}` : 'New Position'}
            </span>
            <div className="flex">
              {isLoadingGameByPosition ? (
                <p className="text-gray-600 dark:text-white">Loading...</p>
              ) : displayGame ? (
                <>
                  <img
                    src={displayGame.thumbnailFile?.s3Key || ""}
                    alt={displayGame.title}
                    className="h-20 w-20 rounded-md mr-4"
                  />
                  <div className='mt-4'>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">{displayGame.title}</h3>
                    <p className="text-gray-600 text-sm dark:text-white">{displayGame.category?.name || "Uncategorized"}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-600 dark:text-white">No game found at this position.</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="bg-[#F8FAFC] border text-[#0F1621] rounded-md py-2 px-4 mr-2 hover:bg-gray-100" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button className="bg-[#D946EF] text-white rounded-md py-2 px-4 hover:bg-[#D946EF]" onClick={handleReorder}>
            Reorder
          </button>
        </div>
      </div>
    </div>
  );
}
