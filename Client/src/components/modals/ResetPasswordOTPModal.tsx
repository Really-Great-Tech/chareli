/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import OTPInput from "react-otp-input";
import { useRequestOtp, useVerifyResetOtp } from "../../backend/auth.service";
import { toast } from "sonner";

interface ResetPasswordOTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  contactMethod?: string; // Phone number that received the OTP
  onVerificationSuccess?: () => void; // Callback for when verification is successful
}

export function ResetPasswordOTPModal({
  open,
  onOpenChange,
  userId,
  contactMethod = "your phone number",
  onVerificationSuccess,
}: ResetPasswordOTPModalProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const verifyResetOtp = useVerifyResetOtp();
  const requestOtp = useRequestOtp();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setError("");
      setIsVerifying(true);
      await verifyResetOtp.mutateAsync({ userId, otp });

      // Close the modal
      onOpenChange(false);

      // Call the success callback if provided
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }

      // Show success message
      toast.success("OTP verified successfully");
    } catch (error: any) {
      setError("Invalid OTP. Please try again.");
      // toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setError("");
      await requestOtp.mutateAsync({ userId, otpType: "SMS" });
      // Show success message
      setError("OTP resent successfully!");
      toast.success("OTP resent successfully!");
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
         <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-2xl font-bold dark:text-white text-black font-boogaloo">
            Reset Password Verification
          </AlertDialogTitle>
          <AlertDialogDescription className="dark:text-white text-black font-pincuk text-xl tracking-wider  mt-1">
            Enter the verification code we just sent to {contactMethod}
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
                  className="w-12 h-12 text-center bg-transparent rounded-none dark:text-white text-black font-pincuk  tracking-wider text-2xl font-bold mx-1 focus:outline-none focus:ring-0"
                />
              </div>
            )}
            inputType="tel"
            shouldAutoFocus
            placeholder=""
          />
        </div>
        {error && (
          <div
            className={` text-center font-pincuk text-xl tracking-wider mt-2 ${
              error.includes("resent") ? "text-green-500" : "text-red-500"
            }`}
          >
            {error}
          </div>
        )}
        <Button
          onClick={handleVerify}
          disabled={isVerifying || otp.length !== 6}
          className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo"
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>
        <p className=" text-center text-black dark:text-white font-pincuk text-xl tracking-wider mt-2">
          Didn't receive a code?{" "}
          <button
            onClick={handleResendOtp}
            disabled={requestOtp.isPending}
            className="underline text-[#C026D3] cursor-pointer"
          >
            {requestOtp.isPending ? "Sending..." : "Resend"}
          </button>
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
}
