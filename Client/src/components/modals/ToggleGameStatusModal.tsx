import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
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
      <DialogContent
        className="rounded-2xl border-0 shadow-sm p-8 max-w-lg font-dmmono tracking-wide dark:bg-[#232B3B] bg-white"
        style={{ boxShadow: "0 2px 4px 2px #e879f9" }}
        hideClose
      >
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-wider mb-2 text-[#121C2D] dark:text-white">
            Are you sure you want to {action} {gameTitle}?
          </DialogTitle>
        </DialogHeader>
        <div className="mb-8 text-[#121C2D] dark:text-[#CBD5E0] font-worksans text-xl tracking-wider">
          {isActive
            ? "Players will not be able to access this game until you enable it again."
            : "Players will be able to access this game once enabled."}
        </div>
        <DialogFooter className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#232B3B] dark:bg-white dark:text-[#232B3B]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="bg-[#D946EF] text-white px-3 py-2 rounded-lg tracking-wider hover:bg-[#c026d3]"
            onClick={onConfirm}
            disabled={isToggling}
          >
            {isToggling
              ? `${actionCapitalized.slice(0, -1)}ing...`
              : actionCapitalized}
          </Button>
        </DialogFooter>
        <DialogClose asChild>
          <button className="absolute -top-4 -right-4 rounded-full bg-[#C026D3] w-10 h-10 flex items-center justify-center text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
