import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { MultiSelect } from "../ui/multi-select";
import { SearchableSelect } from "../ui/searchable-select";
import { useGames } from "../../backend/games.service";
import type { ActivityLogFilterState } from "../../backend/analytics.service";
import { useCallback, useState, useEffect } from "react";

interface ActivityLogFilterSheetProps {
  children: React.ReactNode;
  filters: ActivityLogFilterState;
  onFiltersChange: (filters: ActivityLogFilterState) => void;
  onReset: () => void;
}

export function ActivityLogFilterSheet({
  children,
  filters,
  onFiltersChange,
  onReset,
}: ActivityLogFilterSheetProps) {
  const { data: gamesData } = useGames();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ActivityLogFilterState>(filters);
  
  const titles = [
    ...new Set(((gamesData as any) || [])?.map((game: any) => game.title).filter(Boolean)),
  ] as string[];

  // Sync local filters with props when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleChange = useCallback((field: keyof ActivityLogFilterState, value: unknown) => {
    const newFilters = {
      ...localFilters,
      [field]: value,
    };
    setLocalFilters(newFilters);
    
    // Check if the change is a "clearing" action and apply immediately
    const isClearing = 
      (field === 'userStatus' && value === '') ||
      (field === 'userName' && value === '') ||
      (field === 'activityType' && value === '') ||
      (field === 'gameTitle' && Array.isArray(value) && value.length === 0);
    
    // Apply immediately if clearing, otherwise wait for button click
    if (isClearing) {
      onFiltersChange(newFilters);
    }
  }, [localFilters, onFiltersChange]);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  }, [localFilters, onFiltersChange]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      dateRange: {
        startDate: "",
        endDate: "",
      },
      userStatus: "",
      userName: "",
      gameTitle: [],
      activityType: "",
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    };
    setLocalFilters(resetFilters);
    onReset();
    setIsOpen(false);
  }, [onReset]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621] overflow-y-auto overflow-x-hidden w-[85vw] sm:max-w-sm max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-lg font-normal tracking-wider mt-6">
            Filter Activity Log
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <div className="grid gap-4 px-2 sm:px-4 py-4">
          {/* User Status */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">User Status</Label>
            <SearchableSelect
              value={localFilters.userStatus}
              onValueChange={(value) => handleChange("userStatus", value)}
              options={[
                { value: "", label: "All Status" },
                { value: "Online", label: "Online" },
                { value: "Offline", label: "Offline" },
              ]}
              placeholder="All Status"
              searchPlaceholder="Search status..."
              emptyText="No status found."
            />
          </div>

          {/* User Name */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">User Name</Label>
            <Input
              type="text"
              value={localFilters.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
              placeholder="Search by user name"
              className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D]"
            />
          </div>

          {/* Game Title */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Game Title</Label>
            <MultiSelect
              value={localFilters.gameTitle}
              onValueChange={(value) => handleChange("gameTitle", value)}
              options={titles.map((title) => ({ value: title, label: title }))}
              placeholder="All Games"
              searchPlaceholder="Search games..."
              emptyText="No games found."
            />
          </div>

          {/* Activity Type */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Activity Type</Label>
            <Input
              type="text"
              value={localFilters.activityType}
              onChange={(e) => handleChange("activityType", e.target.value)}
              placeholder="Search by activity type"
              className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D]"
            />
          </div>

          {/* Sort By */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Sort By</Label>
            <SearchableSelect
              value={localFilters.sortBy}
              onValueChange={(value) => handleChange("sortBy", value)}
              options={[
                { value: "createdAt", label: "Registration Date" },
                { value: "name", label: "Name" },
                { value: "email", label: "Email" },
              ]}
              placeholder="Registration Date"
              searchPlaceholder="Search sort options..."
              emptyText="No sort options found."
            />
          </div>

          {/* Sort Order */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Sort Order</Label>
            <SearchableSelect
              value={localFilters.sortOrder}
              onValueChange={(value) => handleChange("sortOrder", value)}
              options={[
                { value: "asc", label: "Ascending (A-Z, Oldest)" },
                { value: "desc", label: "Descending (Z-A, Newest)" },
              ]}
              placeholder="Ascending"
              searchPlaceholder="Search sort order..."
              emptyText="No sort order found."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end px-2 sm:px-4 mb-4 mt-6">
          <Button
            type="button"
            onClick={handleResetFilters}
            className="w-full sm:w-20 h-10 sm:h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] dark:text-gray-300 dark:bg-[#1E293B] dark:border-[#334155] dark:hover:bg-[#334155] cursor-pointer"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="w-full sm:w-20 h-10 sm:h-12 bg-[#D946EF] text-white hover:bg-[#C026D3] dark:text-white dark:hover:bg-[#C026D3] cursor-pointer"
          >
            Filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
