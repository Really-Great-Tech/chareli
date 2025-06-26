import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";

interface ToggleGameStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isToggling?: boolean;
  gameStatus: string;
  gameTitle?: string;
}

export function ToggleGameStatusModal({
  open,
  onOpenChange,
  onConfirm,
  isToggling = false,
  gameStatus,
  gameTitle = "this game",
}: ToggleGameStatusModalProps) {
  const isActive = gameStatus === "active";
  const action = isActive ? "disable" : "enable";
  const actionCapitalized = isActive ? "Disable" : "Enable";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent 
        className="bg-white dark:bg-[#232B3B] rounded-2xl shadow-lg p-4 sm:p-8 min-w-[320px] max-w-[90vw] w-full sm:w-[480px] border-none font-dmmono tracking-wide"
        style={{ boxShadow: "0 2px 4px 2px #e879f9" }}
      >
        {/* Custom Close Button */}
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors z-10"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <XIcon className="w-6 h-6 text-white" />
        </button>

        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl tracking-wider font-semibold text-[#121C2D] dark:text-white">
            Are you sure you want to {action} {gameTitle}?
          </h2>
        </div>

        {/* Description */}
        <div className="mb-6 sm:mb-8 text-[#121C2D] dark:text-[#CBD5E0] font-worksans text-sm sm:text-xl tracking-wider">
          {isActive
            ? "Players will not be able to access this game until you enable it again."
            : "Players will be able to access this game once enabled."}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto h-10 sm:h-12 text-sm rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#232B3B] dark:bg-white dark:text-[#232B3B] order-2 sm:order-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto h-10 sm:h-12 text-sm rounded-lg bg-[#D946EF] text-white tracking-wider hover:bg-[#c026d3] order-1 sm:order-2"
            onClick={onConfirm}
            disabled={isToggling}
          >
            {isToggling
              ? `${actionCapitalized.slice(0, -1)}ing...`
              : actionCapitalized}
          </Button>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
