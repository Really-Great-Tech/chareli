import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import OTPInput from "react-otp-input";

interface OTPVerificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OTPVerificationModal({ open, onOpenChange }: OTPVerificationDialogProps) {
    const [otp, setOtp] = useState("235");

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold dark:text-white text-black font-boogaloo">
                        OTP Verification
                    </AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-white text-black font-pincuk text-xs mt-1">
                        Enter the verification code we just sent via claireme***@gmail.com
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-center my-4">
                    <OTPInput
                        value={otp}
                        onChange={setOtp}
                        numInputs={6}
                        renderInput={(props) => (
                            <div className="px-2 py-2 border-2 border-[#E328AF] mx-1 rounded-lg">
                                <input
                                    {...props}
                                    className="w-12 h-12 text-center bg-transparent  rounded-none dark:text-white text-black font-pincuk text-2xl font-bold mx-1 focus:outline-none focus:ring-0"
                                />
                            </div>
                        )}
                        inputType="tel"
                        shouldAutoFocus
                        placeholder=""
                    />
                </div>
                <AlertDialogAction className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo">
                    Verify
                </AlertDialogAction>
                <p className="text-sm text-center text-black dark:text-white font-pincuk mt-2">
                    Didn't receive a code?{' '}
                    <a href="#" className="underline text-[#C026D3]">Resend</a>
                </p>
            </AlertDialogContent>
        </AlertDialog>
    );
}
