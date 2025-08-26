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
import {
  useCreateSystemConfig,
  useSystemConfigByKey,
} from "../../backend/configuration.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../backend/constants";
import { useState } from "react";

interface PrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacySheet({ open, onOpenChange }: PrivacySheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const createConfig = useCreateSystemConfig();
  const { data: privacyConfig } = useSystemConfigByKey("privacy");

  const hasExistingPrivacy = !!privacyConfig;

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
      formData.append("key", "privacy");
      formData.append("description", "Privacy policy document");

      await createConfig.mutateAsync(formData);
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.SYSTEM_CONFIG, "privacy"],
      });
      toast.success("Privacy policy file uploaded successfully");
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to upload privacy policy file");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="font-dmmono dark:bg-[#0F1621] max-w-xl w-full">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold tracking-wider mt-6">
            Privacy Policy
          </SheetTitle>
          <div className="border border-b-gray-200 mb-2"></div>
        </SheetHeader>
        {/* Current Privacy Policy Display */}
        {hasExistingPrivacy && (
          <div className="mx-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📄 Current Privacy Policy Document
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Uploaded:</span>{" "}
                {privacyConfig?.value?.uploadedAt
                  ? new Date(privacyConfig.value.uploadedAt).toLocaleDateString()
                  : "Unknown"}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Type:</span>{" "}
                {privacyConfig?.value?.file?.type || "privacy"}
              </p>
              {privacyConfig?.value?.file?.s3Key && (
                <a
                  href={privacyConfig.value.file.s3Key}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                >
                  📥 View Current Privacy Policy Document
                </a>
              )}
            </div>
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ Uploading a new file will replace the current privacy policy document
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 pl-4 pr-4"
        >
          {/* File Upload */}
          <div>
            <Label className="text-lg mb-2 block">Upload file</Label>
            <div className="flex items-center">
              <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#6A7282] transition">
                {selectedFile?.name ? (
                  <img src="/doc.png" alt="document icon" className="w-20" />
                ) : (
                  <img
                    src={uploadImg}
                    alt="upload"
                    className="dark:invert dark:brightness-0 dark:contrast-100"
                  />
                )}
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
            className="w-fit h-12 bg-[#6A7282] text-white hover:bg-[#5A626F] dark:text-white dark:hover:bg-[#6A7282] shadow-none cursor-pointer px-4"
            onClick={handleSubmit}
            disabled={!selectedFile || createConfig.isPending}
          >
            {createConfig.isPending
              ? "Uploading..."
              : hasExistingPrivacy
              ? "Replace Privacy Policy"
              : "Add Privacy Policy"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
