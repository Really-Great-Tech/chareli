import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface CreateCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategory({ open, onOpenChange }: CreateCategoryProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    // Handle create logic here
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-lg w-full bg-white dark:bg-[#18192b] p-8 rounded-l-2xl relative"
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#E328AF] text-white font-bold text-xl flex items-center justify-center z-10"
          aria-label="Close"
        >
          ✕
        </button>
        <SheetHeader>
          <SheetTitle className="text-xl mb-2">
            Create New Category
          </SheetTitle>
          <SheetDescription />
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-col gap-6 mt-2">
          <div>
            <Label
              htmlFor="category-name"
              className="text-base mb-1"
            >
              Category Name
            </Label>
            <Input
              id="category-name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#F5F6FA] mt-1 font-pincuk text-base"
            />
          </div>
          <div>
            <Label
              htmlFor="category-description"
              className="text-base mb-1"
            >
              Game Description
            </Label>
            <textarea
              id="category-description"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#F5F6FA] mt-1 font-pincuk text-base rounded-md border border-input w-full min-h-[100px] p-3 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-4 justify-end mt-8">
          <SheetClose asChild>
            <button
              className="px-6 py-2 rounded-md border border-gray-300 bg-white text-black font-pincuk hover:bg-gray-100 transition"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </button>
          </SheetClose>
          <button
            className="px-6 py-2 rounded-md bg-gradient-to-r from-[#E328AF] to-[#C026D3] text-white font-bold transition"
            onClick={handleCreate}
            type="button"
          >
            Create
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CreateCategory;