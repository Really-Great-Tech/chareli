import {
  AlertDialog,
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
import { useRequestOtp } from "../../backend/auth.service";
import { toast } from "sonner";

interface OTPPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  email?: string;
  phone?: string;
}

export function OTPPlatformModal({
  open,
  onOpenChange,
  userId,
  email = "your email",
  phone = "your phone",
}: OTPPlatformDialogProps) {
  const [isOTPVerificationOpen, setIsOTPVerificationOpen] = useState(false);
  const [selectedOtpType, setSelectedOtpType] = useState<"EMAIL" | "SMS">(
    "EMAIL"
  );
  const [error, setError] = useState("");
  const requestOtp = useRequestOtp();

  const handleSendOTP = async () => {
    try {
      setError("");
      await requestOtp.mutateAsync({ userId, otpType: selectedOtpType });
      setIsOTPVerificationOpen(true);
      onOpenChange(false);
    } catch (error) {
      console.error("Error requesting OTP:", error);
      setError("Failed to send OTP. Please try again.");
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221] rounded-lg p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-[#FFAA33] font-dmmono">
            OTP Verification
          </AlertDialogTitle>
          <AlertDialogDescription className=" dark:text-white text-black font-worksans text-xl tracking-wider mt-1">
            Select platform where you want to receive OTP
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 mt-6">
          {error && (
            <div className="text-red-500 font-worksans text-xl tracking-wider text-center mb-4">
              {error}
            </div>
          )}
          <RadioGroup
            defaultValue="EMAIL"
            className="space-y-3"
            onValueChange={(value) =>
              setSelectedOtpType(value as "EMAIL" | "SMS")
            }
          >
            <div className="flex items-center justify-center space-x-3 border-[#DC8B18] border-1 rounded p-2">
              <RadioGroupItem
                value="EMAIL"
                id="email"
                className="text-[#DC8B18] border-2 border-[#DC8B18] h-5 w-5 focus:ring-[#DC8B18] checked:bg-[#DC8B18]"
              />
              <Label
                htmlFor="email"
                className="font-dmmono text-base dark:text-white text-black text-center"
              >
                {email}
              </Label>
            </div>
            <div className="flex items-center justify-center space-x-3 border-[#DC8B18] border-1 rounded p-2">
              <RadioGroupItem
                value="SMS"
                id="phone"
                className="text-[#DC8B18] border-2 border-[#DC8B18] h-5 w-5 focus:ring-[#DC8B18] checked:bg-[#DC8B18]"
              />
              <Label
                htmlFor="phone"
                className="font-dmmono text-base dark:text-white text-black text-center"
              >
                {phone}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleSendOTP}
          className="w-full mt-6 bg-[#DC8B18] hover:bg-[#C17600] text-white font-dmmono py-3 cursor-pointer rounded-md text-lg"
        >
          Next
        </Button>
      </AlertDialogContent>
      <OTPVerificationModal
        open={isOTPVerificationOpen}
        onOpenChange={setIsOTPVerificationOpen}
        userId={userId}
        contactMethod={selectedOtpType === "EMAIL" ? email : phone}
        otpType={selectedOtpType}
        onVerificationSuccess={() => {
          // Close the OTPPlatformModal when verification is successful
          onOpenChange(false);
        }}
      />
    </AlertDialog>
  );
}
