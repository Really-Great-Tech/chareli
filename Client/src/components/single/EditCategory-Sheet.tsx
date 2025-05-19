import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  // SheetDescription,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { XIcon } from "lucide-react";

interface EditCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategory({ open, onOpenChange }: EditCategoryProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = () => {
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
              className="bg-[#F5F6FA] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white py-6"
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
        
        <div className="flex justify-between mt-8 px-3 font-boogaloo items-center">
          <div>
          <button
            className="px-3 py-2 rounded-md bg-[#EF4444] text-white transition"
            onClick={() => setShowDeleteModal(true)}
            type="button"
          >
            Delete
          </button>
          </div>
         <div className="flex gap-3 items-center">
         <SheetClose asChild>
            <button
              className="px-3 py-2 rounded-md border border-gray-300 dark:bg-white text-black hover:bg-gray-100 transition bg-[#F1F5F9]"
              type="button"
            >
              Cancel
            </button>
          </SheetClose>
          
          <button
            className="px-3 py-2 rounded-md bg-[#D946EF] text-white transition"
            onClick={handleEdit}
            type="button"
          >
            Create
          </button>
         </div>
        </div>

        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="dark:bg-[#232B3B] bg-white rounded-2xl p-8 relative w-[90vw] max-w-xl font-boogaloo" style={{ boxShadow: "0 2px 4px 2px #e879f9" }}>
            <button
              className="absolute -top-4 -right-4 rounded-full bg-[#C026D3] w-10 h-10 flex items-center justify-center text-white"
              onClick={() => setShowDeleteModal(false)}
            >
              <XIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-boogaloo dark:text-white mb-2 text-[#121C2D]">Are you sure you want to Delete Category?</h2>
            <p className="dark:text-[#CBD5E0] mb-8 text-[#121C2D] font-pincuk">This action can be reversed</p>
            <div className="flex gap-4 justify-end">
              <button
                className="dark:bg-white text-[#232B3B] px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-[#EF4444] text-white px-3 py-2 rounded-lg tracking-wider"
                // Add your disable/enable logic here
                onClick={() => {
                  // handleDisable();
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </SheetContent>
    </Sheet>
  );
}

export default EditCategory;