import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useUpdateUserData } from "../../backend/user.service";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

interface ChangePasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordSheet({ open, onOpenChange }: ChangePasswordSheetProps) {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<{ oldPassword?: string; newPassword?: string }>({});
  
  const updateUser = useUpdateUserData();
  const { user } = useAuth();

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "Password must contain at least one special character (!@#$%^&*)";
    }
    return "";
  };

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});

    // Validate old password
    if (!oldPassword) {
      setErrors(prev => ({ ...prev, oldPassword: "Old password is required" }));
      return;
    }

    // Validate new password
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      setErrors(prev => ({ ...prev, newPassword: newPasswordError }));
      return;
    }

    try {
      if (!user?.id) {
        toast.error("User ID not found");
        return;
      }

      await updateUser.mutateAsync({
        id: user.id,
        password: newPassword
      });
      toast.success("Password changed successfully");
      onOpenChange(false);
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error("Failed to change password. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md w-full p-6 font-boogaloo dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-lg mt-4 tracking-wider border-b">Change Password</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-2">
          <div>
            <Label htmlFor="profile-oldpassword" className="text-base mb-1">
              Old Password
            </Label>
            <div className="relative">
              <Input
                id="profile-oldpassword"
                type={showOldPassword ? "text" : "password"}
                placeholder="Enter old password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white h-14 shadow-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                tabIndex={-1}
              >
                {showOldPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.oldPassword}</p>
            )}
          </div>
          <div>
            <Label htmlFor="profile-newpassword" className="text-base mb-1">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="profile-newpassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white h-14 shadow-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-white"
                tabIndex={-1}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>
        </div>
        <SheetFooter className="flex flex-row justify-end mt-8 gap-4">
          <SheetClose asChild>
            <Button variant="outline" className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] shadow-none dark:text-white">
              Cancel
            </Button>
          </SheetClose>
          <Button 
            className="w-24 h-12 bg-[#D946EF] hover:bg-[#e782f7] text-white"
            onClick={handleSubmit}
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? "..." : "Update"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default ChangePasswordSheet;
