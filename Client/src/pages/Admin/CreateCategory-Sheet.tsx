import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  // SheetDescription,
  SheetClose,
} from "../../components/ui/sheet";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface CreateCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategory({ open, onOpenChange }: CreateCategoryProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    // Handle create logic here
    console.log("Creating category:", { name, description });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="sm:max-w-md w-[90vw] bg-white dark:bg-[#18192b] border-l border-gray-200 dark:border-gray-800"
      >
        <SheetHeader className="pb-4 mt-8 font-boogaloo">
          <SheetTitle className="text-xl font-bold border-b">Create New Category</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-6 mt-2 font-boogaloo px-3">
          <div>
            <Label htmlFor="category-name" className="text-base mb-1">
              Category Name
            </Label>
            <Input
              id="category-name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#F5F6FA] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="category-description" className="text-base mb-1 mt-4 ">
              Game Description
            </Label>
            <textarea
              id="category-description"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#F5F6FA] mt-1 text-sm rounded-md border border-input w-full min-h-[100px] p-3 resize-none font-pincuk dark:bg-[#121C2D] dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-4 justify-end mt-8 px-3 font-boogaloo">
          <SheetClose asChild>
            <button
              className="px-6 py-2 rounded-md border border-gray-300 bg-white text-black hover:bg-gray-100 transition"
              type="button"
            >
              Cancel
            </button>
          </SheetClose>
          
          <button
            className="px-6 py-2 rounded-md bg-[#D946EF] text-white transition"
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