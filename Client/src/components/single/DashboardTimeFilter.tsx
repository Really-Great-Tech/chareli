import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { DashboardTimeRange } from "../../backend/analytics.service";

interface DashboardTimeFilterProps {
  value: DashboardTimeRange;
  onChange: (timeRange: DashboardTimeRange) => void;
}

const timeRangeOptions = [
  { value: 'last24hours', label: '24 hours' },
  { value: 'last7days', label: '7 days' },
  { value: 'last30days', label: '30 days' },
  { value: 'custom', label: 'Custom range' },
] as const;

export function DashboardTimeFilter({ value, onChange }: DashboardTimeFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(value.startDate || '');
  const [tempEndDate, setTempEndDate] = useState(value.endDate || '');

  const getCurrentLabel = () => {
    if (value.period === 'custom' && value.startDate && value.endDate) {
      const start = new Date(value.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(value.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    }
    return timeRangeOptions.find(option => option.value === value.period)?.label || '24 hours';
  };

  const handlePeriodChange = (period: DashboardTimeRange['period']) => {
    if (period === 'custom') {
      setIsCustomOpen(true);
    } else {
      // Clear custom date inputs when selecting preset time ranges
      setTempStartDate('');
      setTempEndDate('');
      onChange({ period });
    }
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      onChange({
        period: 'custom',
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
      setIsCustomOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#334154] border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] transition-colors cursor-pointer">
            <span className="text-gray-600 dark:text-gray-400">Filter</span>
            <span className="text-[#C17600] font-medium">
              {getCurrentLabel()}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 dark:bg-[#334154]">
          {timeRangeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`cursor-pointer ${
                value.period === option.value 
                  ? 'bg-[#C17600] text-white dark:bg-[#C17600]/20' 
                  : ''
              }`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu> 

      {/* Custom Date Range Dialog */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="sm:max-w-md dark:bg-[#334154]">
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#64748A] dark:text-gray-300 dark:border-[#334155] date-input-dark w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-12 sm:h-14 text-gray-400 font-thin font-worksans text-sm tracking-wider dark:bg-[#64748A] dark:text-gray-300 dark:border-[#334155] date-input-dark w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCustomOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomDateApply}
              disabled={!tempStartDate || !tempEndDate}
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
