import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { MultiSelect } from "../ui/multi-select";
import { countries } from "country-data-list";

interface DashboardCountryFilterProps {
  value: string[];
  onChange: (countries: string[]) => void;
}

export function DashboardCountryFilter({ value, onChange }: DashboardCountryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<string[]>(value);

  const countryList = countries.all.map((country: any) => country.name).sort();
  const countryOptions = countryList.map((country) => ({
    value: country,
    label: country,
  }));

  const getCurrentLabel = () => {
    if (value.length === 0) {
      return "All countries";
    } else if (value.length === 1) {
      return value[0];
    } else if (value.length === 2) {
      return value.join(", ");
    } else {
      return `${value.length} countries`;
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempValue(value);
    }
  };

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#334154] border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] transition-colors cursor-pointer"
      >
        <span className="text-gray-600 dark:text-gray-400">Filter</span>
        <span className="text-[#C17600] font-medium">
          {getCurrentLabel()}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md dark:bg-[#334154]">
          <DialogHeader>
            <DialogTitle>Select Countries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MultiSelect
              value={tempValue}
              onValueChange={setTempValue}
              options={countryOptions}
              placeholder="Search countries..."
              searchPlaceholder="Search countries..."
              emptyText="No countries found."
              className="country-filter-select"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-[#DC8B18] hover:bg-[#C17600] text-white"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
