import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { Button } from "../ui/button";
import { XIcon, AlertTriangle } from "lucide-react";

interface UnsavedChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
  onStay: () => void;
}

export function UnsavedChangesModal({
  open,
  onOpenChange,
  onConfirmLeave,
  onStay,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent
        className="bg-white dark:bg-[#334154] rounded-2xl shadow-lg p-4 sm:p-8 min-w-[320px] max-w-[90vw] w-full sm:w-[420px] border-none font-dmmono tracking-wide"
      >
        {/* Custom Close Button */}
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#6A7282] flex items-center justify-center shadow-lg hover:bg-[#5A626F] transition-colors z-10"
          onClick={() => {
            onOpenChange(false);
            onStay();
          }}
          aria-label="Close"
        >
          <XIcon className="w-6 h-6 text-white" />
        </button>

        {/* Warning Icon and Title */}
        <div className="mb-4 sm:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg sm:text-xl tracking-wider font-semibold text-[#0F1621] dark:text-white">
            Unsaved Changes
          </h2>
        </div>

        {/* Description */}
        <div className="mb-6 sm:mb-8 text-[#22223B] text-sm sm:text-[16px] tracking-wider dark:text-white">
          You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto h-10 sm:h-12 text-sm rounded-lg dark:bg-white dark:text-black order-2 sm:order-1 cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              onStay();
            }}
          >
            Stay on Page
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto h-10 sm:h-12 text-sm rounded-lg dark:bg-[#EF4444] order-1 sm:order-2 cursor-pointer"
            onClick={onConfirmLeave}
          >
            Leave Without Saving
          </Button>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
