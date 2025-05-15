import {
    AlertDialog,
    // AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { OTPVerificationModal } from "./OTPVerificationModal";
import { Button } from "../ui/button";
import { useState } from "react";

interface OTPPlatformDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OTPPlatformModal({ open, onOpenChange }: OTPPlatformDialogProps) {
    const [isOTPVerificationOpen, setIsOTPVereficationOpen] = useState(false);

    const handleSendOTP = () => {
        // Logic to send OTP
        console.log("OTP sent");
        setIsOTPVereficationOpen(true);
        onOpenChange(false);
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221] rounded-lg p-6">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold dark:text-white text-black font-boogaloo">
                        OTP Verification
                    </AlertDialogTitle>
                    <AlertDialogDescription className=" dark:text-white text-black font-pincuk text-xs mt-1">
                        Select platform where you want to receive OTP
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 mt-6">
                    <RadioGroup defaultValue="email" className="space-y-3">
                        <div className="flex items-center justify-center space-x-3 border-[#E328AF] border-1 rounded p-2">
                            <RadioGroupItem
                                value="email"
                                id="email"
                                className="text-[#E328AF] border-2 border-[#E328AF] h-5 w-5 focus:ring-[#E328AF] checked:bg-[#E328AF]"
                            />
                            <Label
                                htmlFor="email"
                                className="font-boogaloo text-base dark:text-white text-black text-center"
                            >
                                Claire***@gmail.com
                            </Label>
                        </div>
                        <div className="flex items-center justify-center space-x-3 border-[#E328AF] border-1 rounded p-2">
                            <RadioGroupItem
                                value="phone"
                                id="phone"
                                className="text-[#E328AF] border-2 border-[#E328AF] h-5 w-5 focus:ring-[#E328AF] checked:bg-[#E328AF]"
                            />
                            <Label
                                htmlFor="phone"
                                className="font-boogaloo text-base dark:text-white text-black text-center"
                            >
                                +479008****98
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <Button onClick={handleSendOTP} className="w-full mt-6 bg-[#E328AF] hover:bg-[#C026D3] text-white font-boogaloo py-3 rounded-md text-lg">
                    Next
                </Button>

            </AlertDialogContent>
            <OTPVerificationModal open={isOTPVerificationOpen} onOpenChange={setIsOTPVereficationOpen} />
        </AlertDialog>
    );
}
