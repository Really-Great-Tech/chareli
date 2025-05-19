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
  
  interface ChangePasswordSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: {
      oldpassword: string;
      newpassword: string;
    };
  }
  
  export function ChangePasswordSheet({ open, onOpenChange, profile }: ChangePasswordSheetProps) {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Add local state for the input fields
    const [oldPassword, setOldPassword] = useState(profile.oldpassword || "");
    const [newPassword, setNewPassword] = useState(profile.newpassword || "");

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="max-w-md w-full p-x6 font-boogaloo dark:bg-[#0F1621]">
          <SheetHeader>
            <SheetTitle className="text-lg mt-4 tracking-wider border-b">Change Password</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6  px-2">
            <div>
              <Label htmlFor="profile-oldpassword" className="text-base mb-1">
                Old Password
              </Label>
              <div className="relative">
                <Input
                  id="profile-oldpassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder=""
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white h-14 shadow-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  tabIndex={-1}
                >
                  {showOldPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="profile-newpassword" className="text-base mb-1">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="profile-newpassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder=""
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white h-14 shadow-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-white"
                  tabIndex={-1}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
          <SheetFooter className="flex flex-row justify-end mt-2 gap-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] shadow-none dark:text-white">
                Cancel
              </Button>
            </SheetClose>
            <Button className="w-24 h-12 bg-[#D946EF] hover:bg-[#e782f7] text-white">
              Update
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }
  
  export default ChangePasswordSheet;