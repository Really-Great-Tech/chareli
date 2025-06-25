import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useCategories } from "../../backend/category.service";
import type { GameStatus } from "../../backend/types";

interface FilterSheetProps {
  children: React.ReactNode;
  onFilter: (filters: { categoryId?: string; status?: GameStatus }) => void;
  onReset: () => void;
}

export function FilterSheet({ children, onFilter, onReset }: FilterSheetProps) {
  const { data: categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-lg font-normal tracking-wider mt-6">
            Filter
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <form
          className="grid gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onFilter({
              categoryId:
                selectedCategory === "all" ? undefined : selectedCategory,
              status:
                selectedStatus === "all"
                  ? undefined
                  : (selectedStatus as GameStatus),
            });
          }}
        >
          {/* category */}
          <div className="items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="category" className="text-right text-base">
                Select Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#121C2D]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* status */}
          <div className="items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="status" className="text-right text-base">
                Select Game Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#121C2D]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end px-2">
            <SheetClose asChild>
              <Button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  onReset();
                }}
                className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent"
              >
                Reset
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                type="submit"
                className="w-20 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
              >
                Filter
              </Button>
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
