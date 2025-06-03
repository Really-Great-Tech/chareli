/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import OTPInput from "react-otp-input";
import { useAuth } from "../../context/AuthContext";
import { useRequestOtp } from "../../backend/auth.service";
import { toast } from "sonner";
import { isValidRole } from "../../utils/main";

interface OTPVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  contactMethod?: string; // Email or phone number that received the OTP
  otpType?: "EMAIL" | "SMS" | "BOTH"; // Type of OTP sent
  onVerificationSuccess?: () => void; // Callback for when verification is successful
}

export function OTPVerificationModal({
  open,
  onOpenChange,
  userId,
  contactMethod = "your email or phone",
  otpType = "EMAIL",
  onVerificationSuccess,
}: OTPVerificationDialogProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyOtp } = useAuth();
  const requestOtp = useRequestOtp();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setError("");
      setIsVerifying(true);
      const user = await verifyOtp(userId, otp);

      // Close the modal
      onOpenChange(false);

      // Call the success callback if provided
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }

      const userRole = (user as any)?.data?.role.name;

      setTimeout(() => {
        if (isValidRole(userRole)) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 300);

      // Show success message
      toast.success("Login successful! Redirecting...");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Invalid OTP. Please try again.");
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setError("");
      await requestOtp.mutateAsync({ userId, otpType });
      // Show success message
      setError("OTP resent successfully!");
      toast.success("OTP resent successfully!");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6 dark:bg-[#0F1221] rounded-xl">
        {/* Custom Close Button */}
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl sm:text-2xl font-bold dark:text-white text-black font-boogaloo">
            OTP Verification
          </AlertDialogTitle>
          <AlertDialogDescription className="dark:text-white text-black font-boogaloo text-md tracking-wider sm:text-sm mt-1">
            Enter the verification code we just sent to{" "}
            {otpType === "BOTH" ? "both " : ""}
            {contactMethod}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center my-4 sm:my-6">
          <OTPInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderInput={(props) => (
              <div className="px-3 sm:px-3 py-2 sm:py-3 border-2 border-[#E328AF] mx-0.5 sm:mx-1 rounded-lg">
                <input
                  {...props}
                  className="w-12 h-12 sm:w-12 sm:h-12 text-center bg-transparent rounded-none dark:text-white text-black font-pincuk text-xl sm:text-2xl font-bold focus:outline-none focus:ring-0"
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
            className={`text-xs sm:text-sm text-center font-pincuk mt-2 sm:mt-3 ${
              error.includes("resent") ? "text-green-500" : "text-red-500"
            }`}
          >
            {error}
          </div>
        )}
        <Button
          onClick={handleVerify}
          disabled={isVerifying || otp.length !== 6}
          className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo text-base sm:text-lg py-2 sm:py-3 mt-4 sm:mt-6"
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>
        <p className="text-xs sm:text-sm text-center text-black dark:text-white font-boogaloo mt-2 sm:mt-3">
          Didn't receive a code?{" "}
          <button
            onClick={handleResendOtp}
            disabled={requestOtp.isPending}
            className="underline text-[#C026D3] cursor-pointer text-lg"
          >
            {requestOtp.isPending ? "Sending..." : "Resend"}
          </button>
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
}
