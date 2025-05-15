import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface WelcomeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WelcomeModal({ open, onOpenChange }: WelcomeDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#334154] rounded-lg p-6">
                <button
                    onClick={() => onOpenChange(false)}
                    className="cursor-pointer absolute top-[-19px] right-[-10px] w-8 h-8 rounded-full bg-[#C026D3] text-white font-bold text-xl flex items-center justify-center"
                    aria-label="Close"
                >
                    ✕
                </button>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold dark:text-white text-black text-left font-boogaloo">
                        Welcome to Our Website
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left dark:text-white text-black font-pincuk text-xs mt-1">
                        Please take a moment to review our new features
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 mt-6">
                    <AlertDialogAction
                        className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black font-pincuk py-3 rounded-md text-lg"
                        onClick={() => onOpenChange(false)}
                    >
                        New added games
                    </AlertDialogAction>
                    <AlertDialogAction
                        className="w-full bg-[#E328AF] hover:bg-[#C026D3] text-black font-pincuk py-3 rounded-md text-lg"
                        onClick={() => onOpenChange(false)}
                    >
                        Larger game screen
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}