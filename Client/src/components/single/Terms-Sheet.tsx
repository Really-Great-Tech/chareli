import { Button } from '../ui/button';
import { Label } from '../ui/label';
import uploadImg from '../../assets/fetch-upload.svg';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

interface TermsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    oldpassword: string;
    newpassword: string;
  };
}

export function TermsSheet({ open, onOpenChange }: TermsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] max-w-xl w-full">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold tracking-wider mt-6">
            Terms of Use
          </SheetTitle>
          <div className="border border-b-gray-200 mb-2"></div>
        </SheetHeader>
        <form className="grid grid-cols-1 gap-6 pl-4 pr-4">
          {/* Thumbnail Upload */}
          <div>
            <Label className="text-lg mb-2 block">Upload file</Label>
            <div className="flex items-center">
              <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                <img src={uploadImg} alt="upload" className="dark:text-white" />
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        </form>
        <div className="flex gap-3 justify-end px-2 mt-4">
          <SheetClose asChild>
            <Button
              type="button"
              className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent shadow-none"
            >
              Cancel
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              type="submit"
              className="w-20 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF] shadow-none"
            >
              Add
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
