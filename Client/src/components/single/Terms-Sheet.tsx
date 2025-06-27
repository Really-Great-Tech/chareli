import { Button } from "../ui/button";
import { Label } from "../ui/label";
import uploadImg from "../../assets/fetch-upload.svg";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { useCreateSystemConfig } from "../../backend/configuration.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../backend/constants";
import { useState } from "react";

interface TermsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsSheet({ open, onOpenChange }: TermsSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const createConfig = useCreateSystemConfig();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (
        !file.type.match(
          "application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should not exceed 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("key", "terms");
      formData.append("description", "Terms of use document");

      await createConfig.mutateAsync(formData);
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.SYSTEM_CONFIG, "terms"],
      });
      toast.success("Terms file uploaded successfully");
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to upload terms file");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="font-dmmono dark:bg-[#0F1621] max-w-xl w-full">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold tracking-wider mt-6">
            Terms of Use
          </SheetTitle>
          <div className="border border-b-gray-200 mb-2"></div>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 pl-4 pr-4"
        >
          {/* Thumbnail Upload */}
          <div>
            <Label className="text-lg mb-2 block">Upload file</Label>
            <div className="flex items-center">
              <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                <img src={uploadImg} alt="upload" className="dark:text-white" />
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <span className="mt-2 text-sm text-gray-500 truncate max-w-[140px]">
                    {selectedFile.name}
                  </span>
                )}
              </label>
            </div>
            <p className="mt-4 text-red-400">only doc/docx* files</p>
          </div>
        </form>
        <div className="flex gap-3 justify-end px-2 mt-4">
          <SheetClose asChild>
            <Button
              type="button"
              className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] dark:text-gray-300 dark:bg-[#1E293B] dark:border-[#334155] dark:hover:bg-[#334155] shadow-none cursor-pointer"
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            className="w-20 h-12 bg-[#D946EF] text-white hover:bg-[#C026D3] dark:text-white dark:hover:bg-[#C026D3] shadow-none cursor-pointer"
            onClick={handleSubmit}
            disabled={!selectedFile || createConfig.isPending}
          >
            {createConfig.isPending ? "Uploading..." : "Add"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
