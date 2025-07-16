import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { MultiSelect } from "../ui/multi-select";
import { SearchableSelect } from "../ui/searchable-select";
import { useGames } from "../../backend/games.service";
import { useCategories } from "../../backend/category.service";
import { countries } from "country-data-list";

interface FilterState {
  registrationDates: {
    startDate: string;
    endDate: string;
  };
  lastLoginDates: {
    startDate: string;
    endDate: string;
  };
  sessionCount: string;
  timePlayed: {
    min: number;
    max: number;
  };
  gameTitle: string[];
  gameCategory: string[];
  country: string[];
  ageGroup: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface UserManagementFilterSheetProps {
  children: React.ReactNode;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  users?: Array<{ country?: string }>;
}

export function UserManagementFilterSheet({
  children,
  filters,
  onFiltersChange,
  onReset,
}: UserManagementFilterSheetProps) {
  const { data: gamesData } = useGames();
  const { data: categoriesData } = useCategories();

  const categories = [
    ...new Set(
      categoriesData?.map((category) => category.name).filter(Boolean)
    ),
  ] as string[];

  const titles = [
    ...new Set(
      ((gamesData as any) || [])?.map((game: any) => game.title).filter(Boolean)
    ),
  ] as string[];

  // Get countries from country-data-list package (standardized list)
  const countryList = countries.all.map((country: any) => country.name).sort();

  const handleChange = (field: keyof FilterState, value: unknown) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621] overflow-y-auto overflow-x-hidden w-[85vw] sm:max-w-sm max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-lg font-normal tracking-wider mt-6">
            Filter
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <div className="grid gap-4 px-2 sm:px-4 py-4">
          {/* Registration Dates */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Registration Dates</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                value={filters.registrationDates.startDate}
                onChange={(e) =>
                  handleChange("registrationDates", {
                    ...filters.registrationDates,
                    startDate: e.target.value,
                  })
                }
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-gray-300 dark:border-[#334155] date-input-dark"
              />
              <Input
                type="date"
                value={filters.registrationDates.endDate}
                onChange={(e) =>
                  handleChange("registrationDates", {
                    ...filters.registrationDates,
                    endDate: e.target.value,
                  })
                }
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-gray-300 dark:border-[#334155] date-input-dark"
              />
            </div>
          </div>

          {/* Session Count */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Session Count</Label>
            <Input
              type="number"
              min="0"
              value={filters.sessionCount}
              onChange={(e) => handleChange("sessionCount", e.target.value)}
              placeholder="Minimum sessions"
              className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D]"
            />
          </div>

          {/* Time Played (in minutes) */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Time Played (minutes)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="number"
                min="0"
                value={
                  filters.timePlayed.min === 0 ? "" : filters.timePlayed.min
                }
                onChange={(e) =>
                  handleChange("timePlayed", {
                    ...filters.timePlayed,
                    min:
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10) || 0,
                  })
                }
                placeholder="Min minutes"
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D]"
              />
              <Input
                type="number"
                min={filters.timePlayed.min}
                value={
                  filters.timePlayed.max === 0 ? "" : filters.timePlayed.max
                }
                onChange={(e) =>
                  handleChange("timePlayed", {
                    ...filters.timePlayed,
                    max:
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10) || 0,
                  })
                }
                placeholder="Max minutes"
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D]"
              />
            </div>
          </div>

          {/* Game Category */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Game Category</Label>
            <MultiSelect
              value={filters.gameCategory}
              onValueChange={(value) => handleChange("gameCategory", value)}
              options={categories.map((category) => ({
                value: category,
                label: category,
              }))}
              placeholder="All Categories"
              searchPlaceholder="Search categories..."
              emptyText="No categories found."
            />
          </div>

          {/* Game Title */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Game Title</Label>
            <MultiSelect
              value={filters.gameTitle}
              onValueChange={(value) => handleChange("gameTitle", value)}
              options={titles.map((title) => ({ value: title, label: title }))}
              placeholder="All Games"
              searchPlaceholder="Search games..."
              emptyText="No games found."
            />
          </div>

          {/* Country */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Country</Label>
            <MultiSelect
              value={filters.country}
              onValueChange={(value) => handleChange("country", value)}
              options={countryList.map((country) => ({
                value: country,
                label: country,
              }))}
              placeholder="All Countries"
              searchPlaceholder="Search countries..."
              emptyText="No countries found."
            />
          </div>

          {/* Last Login Dates */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Last Login Dates</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                value={filters.lastLoginDates.startDate}
                onChange={(e) =>
                  handleChange("lastLoginDates", {
                    ...filters.lastLoginDates,
                    startDate: e.target.value,
                  })
                }
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-gray-300 dark:border-[#334155] date-input-dark"
              />
              <Input
                type="date"
                value={filters.lastLoginDates.endDate}
                onChange={(e) =>
                  handleChange("lastLoginDates", {
                    ...filters.lastLoginDates,
                    endDate: e.target.value,
                  })
                }
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-gray-300 dark:border-[#334155] date-input-dark"
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Sort By</Label>
            <SearchableSelect
              value={filters.sortBy}
              onValueChange={(value) => handleChange("sortBy", value)}
              options={[
                { value: "createdAt", label: "Registration Date (Default)" },
                { value: "firstName", label: "First Name" },
                { value: "lastName", label: "Last Name" },
                { value: "email", label: "Email" },
                { value: "lastLoggedIn", label: "Last Login" },
                { value: "lastSeen", label: "Last Seen" },
                { value: "country", label: "Country" },
                { value: "timePlayed", label: "Time Played" },
                { value: "sessionCount", label: "Session Count" },
              ]}
              placeholder="Registration Date (Default)"
              searchPlaceholder="Search sort options..."
              emptyText="No sort options found."
            />
          </div>

          {/* Sort Order */}
          <div className="flex flex-col space-y-2">
            <Label className="text-base">Sort Order</Label>
            <SearchableSelect
              value={filters.sortOrder}
              onValueChange={(value) => handleChange("sortOrder", value)}
              options={[
                { value: "asc", label: "Ascending (A-Z, 0-9, Oldest)" },
                { value: "desc", label: "Descending (Z-A, 9-0, Newest)" },
              ]}
              placeholder="Ascending"
              searchPlaceholder="Search sort order..."
              emptyText="No sort order found."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end px-2 sm:px-4 mb-4 mt-6">
          <SheetClose asChild>
            <Button
              type="button"
              onClick={onReset}
              className="w-full sm:w-20 h-10 sm:h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] dark:text-gray-300 dark:bg-[#1E293B] dark:border-[#334155] dark:hover:bg-[#334155] cursor-pointer"
            >
              Reset
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              type="button"
              className="w-full sm:w-20 h-10 sm:h-12 bg-[#D946EF] text-white hover:bg-[#C026D3] dark:text-white dark:hover:bg-[#C026D3] cursor-pointer"
            >
              Filter
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
