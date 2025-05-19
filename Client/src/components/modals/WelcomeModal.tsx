import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { Button } from "../../components/ui/button";

interface WelcomeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <CustomDialogContent className="sm:max-w-[425px] dark:bg-[#334154] rounded-lg p-6 border-none">
                <button
                    onClick={() => onOpenChange(false)}
                    className="cursor-pointer absolute -top-4 -right-4 w-8 h-8 rounded-full bg-[#C026D3] text-white font-bold text-xl flex items-center justify-center"
                    aria-label="Close"
                >
                    ✕
                </button>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold dark:text-white text-black text-left font-pong">
                        Welcome to Our Website
                    </DialogTitle>
                    <DialogDescription className="text-left dark:text-white text-black font-pincuk text-xs mt-1">
                        Please take a moment to review our new features
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-6">
                    <Button
                        className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black font-pincuk py-3 rounded-md text-lg"
                        onClick={() => onOpenChange(false)}
                    >
                        New added games
                    </Button>
                    <Button
                        className="w-full bg-[#E328AF] hover:bg-[#C026D3] text-black font-pincuk py-3 rounded-md text-lg"
                        onClick={() => onOpenChange(false)}
                    >
                        Larger game screen
                    </Button>
                </div>
            </CustomDialogContent>
        </Dialog>
    );
}
