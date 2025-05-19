import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  description?: string;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  title = "Are you sure you want to delete?",
  description = "This action cannot be reversed"
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl border-0 shadow-sm p-8 max-w-lg font-boogaloo tracking-wide dark:bg-[#334154]"
        style={{ boxShadow: "0 2px 4px 2px #e879f9" }}
        hideClose
      >
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-wider mb-2">{title}</DialogTitle>
        </DialogHeader>
        <div className="mb-8 text-[#22223B] text-base font-pincuk dark:text-white">{description}</div>
        <DialogFooter className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button variant="outline" className="w-20 h-12 text-lg rounded-lg dark:bg-white dark:text-black">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className="w-20 h-12 text-lg rounded-lg dark:bg-[#EF4444]"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
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
