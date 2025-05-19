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

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    name: string;
    email: string;
    phone: string;
  };
}

export function EditProfileSheet({ open, onOpenChange, profile }: EditProfileSheetProps) {
  // Add local state for each field
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md w-full p-6 font-boogaloo dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-lg mt-4 tracking-wider">Edit Profile</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 mt-4 px-2">
          <div>
            <Label htmlFor="profile-name" className="text-base mb-1">
              Name
            </Label>
            <Input
              id="profile-name"
              placeholder={profile.name}
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="profile-email" className="text-base mb-1">
              Email
            </Label>
            <Input
              id="profile-email"
              placeholder={profile.email}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="profile-phone" className="text-base mb-1">
              Phone Number
            </Label>
            <Input
              id="profile-phone"
              placeholder={profile.phone}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white"
            />
          </div>
        </div>
        <SheetFooter className="flex flex-row justify-end mt-8 gap-4">
          <SheetClose asChild>
            <Button variant="outline" className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] dark:text-white">
              Cancel
            </Button>
          </SheetClose>
          <Button className="w-20 h-12 bg-[#D946EF] text-white tracking-wide">
            Update
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default EditProfileSheet;