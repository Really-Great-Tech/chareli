import { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa6";
import { useUpdateGamePosition } from "../../../backend/games.service";
import { useDebouncedGameByPosition } from "../../../hooks/useDebouncedGameByPosition";
import { toast } from "sonner";

interface ReOrderModalProps {
  onOpenChange: (open: boolean) => void;
  game: {
    id: string;
    title: string;
    category?: { id: string; name: string } | null;
    thumbnailFile?: { url: string } | null;
    position?: string | number;
  } | null;
}

export default function ReOrderModal({
  onOpenChange,
  game,
}: ReOrderModalProps) {
  const [positionInput, setPositionInput] = useState<string>("");
  const [targetPosition, setTargetPosition] = useState<number | null>(null);

  const {
    data: gameByPosition,
    isLoading: isLoadingGameByPosition,
    isDebouncing,
  } = useDebouncedGameByPosition(targetPosition, {
    delay: 300,
    silent: true,
  });
  const { mutate: updateGamePosition } = useUpdateGamePosition();

  useEffect(() => {
    if (positionInput.trim()) {
      const parsedPosition = parseInt(positionInput.trim());
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
      updateGamePosition(
        { id: game.id, position: targetPosition },
        {
          onSuccess: () => {
            toast.success(
              `Game "${game.title}" successfully moved to position #${targetPosition}`
            );
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message || "Failed to update game position"
            );
          },
        }
      );
    }
  };

  const displayGame = gameByPosition || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-0">
      <div className="relative bg-white dark:bg-[#334154] rounded-lg shadow-md p-4 sm:p-6 w-full max-w-sm sm:max-w-xl">
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <h2 className="text-[26px] font-semibold text-[#0F1621] dark:text-white mb-2">
          Reorder Game
        </h2>
        <p className="text-gray-700 text-[14px] mb-6 dark:text-white">
          The new order number will be swapped with the existing number if
          already taken. This action can be reversed.
        </p>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-start">
            <img
              src={game.thumbnailFile?.url || ""}
              alt={game.title}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-md mr-3 sm:mr-4 object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-white truncate">
                {game.title}
              </h3>
              <p className="text-gray-600 text-sm dark:text-white truncate">
                {game.category?.name || "Uncategorized"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-end">
            <label className="text-sm font-medium text-gray-700 dark:text-white mr-2 sm:hidden">
              New Position:
            </label>
            <input
              type="text"
              placeholder="#1"
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-16 sm:w-20 sm:mr-2 text-center bg-[#F1F5F9] dark:bg-[#64748A] placeholder placeholder:text-[#121C2D] dark:placeholder:text-white"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 w-full space-y-4 sm:space-y-0">
          <div className="bg-gray-200 dark:bg-[#64748A] rounded-md p-3 sm:p-4 flex flex-col items-start flex-1 sm:mr-4">
            <span className="text-base sm:text-lg font-bold text-[#0F1621] dark:text-white mb-2">{`#${game?.position}`}</span>
            <div className="flex items-start">
              <img
                src={game.thumbnailFile?.url || ""}
                alt={game.title}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-md mr-3 sm:mr-4 object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-medium text-gray-800 dark:text-white truncate">
                  {game.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm dark:text-white truncate">
                  {game.category?.name || "Uncategorized"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center sm:mx-4">
            <FaArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-[#0F1621] dark:text-white transform rotate-90 sm:rotate-0" />
          </div>
          
          <div className="bg-gray-200 dark:bg-[#64748A] rounded-md p-3 sm:p-4 flex flex-col items-start flex-1 sm:ml-4">
            <span className="text-base sm:text-lg font-bold text-[#0F1621] dark:text-white mb-2">
              {targetPosition ? `#${targetPosition}` : "New Position"}
            </span>
            <div className="flex items-start">
              {isLoadingGameByPosition || isDebouncing ? (
                <p className="text-gray-600 dark:text-white text-sm">
                  {isDebouncing ? "Searching..." : "Loading..."}
                </p>
              ) : displayGame ? (
                <>
                  <img
                    src={displayGame.thumbnailFile?.s3Key || ""}
                    alt={displayGame.title}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-md mr-3 sm:mr-4 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-800 dark:text-white truncate">
                      {displayGame.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm dark:text-white truncate">
                      {displayGame.category?.name || "Uncategorized"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-600 dark:text-white text-sm">
                  No game found at this position.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="bg-[#F8FAFC] border text-[#0F1621] rounded-md py-2 px-4 mr-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="bg-[#D946EF] text-white rounded-md py-2 px-4 hover:bg-[#D946EF] cursor-pointer"
            onClick={handleReorder}
          >
            Reorder
          </button>
        </div>
      </div>
    </div>
  );
}
