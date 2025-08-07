import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
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

interface HistoryFilterSheetProps {
  children: React.ReactNode;
  onFilter: (filters: {
    position?: number;
    positionMin?: number;
    positionMax?: number;
    clickCountMin?: number;
    clickCountMax?: number;
    gameTitle?: string;
  }) => void;
  onReset: () => void;
}

export function HistoryFilterSheet({
  children,
  onFilter,
  onReset,
}: HistoryFilterSheetProps) {
  const [position, setPosition] = useState<string>("");
  const [positionMin, setPositionMin] = useState<string>("");
  const [positionMax, setPositionMax] = useState<string>("");
  const [clickCountMin, setClickCountMin] = useState<string>("");
  const [clickCountMax, setClickCountMax] = useState<string>("");
  const [gameTitle, setGameTitle] = useState<string>("");
  const [positionFilterType, setPositionFilterType] = useState<string>("all");

  const resetFilters = () => {
    setPosition("");
    setPositionMin("");
    setPositionMax("");
    setClickCountMin("");
    setClickCountMax("");
    setGameTitle("");
    setPositionFilterType("all");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-lg font-normal tracking-wider mt-6">
            Filter History
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <form
          className="grid gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onFilter({
              position:
                positionFilterType === "specific" && position
                  ? parseInt(position)
                  : undefined,
              positionMin:
                positionFilterType === "range" && positionMin
                  ? parseInt(positionMin)
                  : undefined,
              positionMax:
                positionFilterType === "range" && positionMax
                  ? parseInt(positionMax)
                  : undefined,
              clickCountMin: clickCountMin
                ? parseInt(clickCountMin)
                : undefined,
              clickCountMax: clickCountMax
                ? parseInt(clickCountMax)
                : undefined,
              gameTitle: gameTitle || undefined,
            });
          }}
        >
          {/* Game Title Search */}
          <div className="items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="gameTitle" className="text-right text-base">
                Game Title
              </Label>
              <Input
                id="gameTitle"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="Search by game title..."
                className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full"
              />
            </div>
          </div>

          {/* Position Filter */}
          <div className="items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="positionType" className="text-right text-base">
                Position Filter
              </Label>
              <Select
                value={positionFilterType}
                onValueChange={setPositionFilterType}
              >
                <SelectTrigger className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full">
                  <SelectValue placeholder="Select position filter type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#121C2D]">
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="specific">Specific Position</SelectItem>
                  <SelectItem value="range">Position Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specific Position */}
          {positionFilterType === "specific" && (
            <div className="items-center gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="position" className="text-right text-base">
                  Position Number
                </Label>
                <Input
                  id="position"
                  type="number"
                  min="1"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., 1"
                  className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full"
                />
              </div>
            </div>
          )}

          {/* Position Range */}
          {positionFilterType === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="positionMin" className="text-right text-base">
                  Min Position
                </Label>
                <Input
                  id="positionMin"
                  type="number"
                  min="1"
                  value={positionMin}
                  onChange={(e) => setPositionMin(e.target.value)}
                  placeholder="e.g., 1"
                  className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-xl tracking-wider w-full"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="positionMax" className="text-right text-base">
                  Max Position
                </Label>
                <Input
                  id="positionMax"
                  type="number"
                  min="1"
                  value={positionMax}
                  onChange={(e) => setPositionMax(e.target.value)}
                  placeholder="e.g., 10"
                  className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-xl tracking-wider w-full"
                />
              </div>
            </div>
          )}

          {/* Click Count Range */}
          <div className="items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-right text-base">Click Count Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="clickCountMin"
                    className="text-sm text-gray-600"
                  >
                    Min Clicks
                  </Label>
                  <Input
                    id="clickCountMin"
                    type="number"
                    min="0"
                    value={clickCountMin}
                    onChange={(e) => setClickCountMin(e.target.value)}
                    placeholder="e.g., 0"
                    className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="clickCountMax"
                    className="text-sm text-gray-600"
                  >
                    Max Clicks
                  </Label>
                  <Input
                    id="clickCountMax"
                    type="number"
                    min="0"
                    value={clickCountMax}
                    onChange={(e) => setClickCountMax(e.target.value)}
                    placeholder="e.g., 100"
                    className="h-14 bg-[#F1F5F9] border border-[#CBD5E0] font-worksans text-sm tracking-wider w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end px-2">
            <SheetClose asChild>
              <Button
                type="button"
                onClick={() => {
                  resetFilters();
                  onReset();
                }}
                className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent dark:hover:bg-[#F8FAFC] cursor-pointer"
              >
                Reset
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                type="submit"
                className="w-20 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF] dark:hover:text-[#D946EF] cursor-pointer"
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
