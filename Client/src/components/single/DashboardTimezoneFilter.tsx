import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DashboardTimezoneFilterProps {
  value: string;
  onChange: (timezone: string) => void;
}

// Common timezones for admin users
const timezoneOptions = [
  { value: 'Europe/Nicosia', label: 'Europe/Nicosia (GMT+2)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Accra', label: 'Africa/Accra (GMT+0)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (GMT+1)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0/+1)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
];

export function DashboardTimezoneFilter({ value, onChange }: DashboardTimezoneFilterProps) {
  const getCurrentLabel = () => {
    const option = timezoneOptions.find(opt => opt.value === value);
    return option?.label || value || 'UTC';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#334154] border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] transition-colors cursor-pointer">
          <span className="text-gray-600 dark:text-gray-400">Timezone</span>
          <span className="text-[#6A7282] dark:text-white font-medium truncate max-w-32">
            {getCurrentLabel()}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 dark:bg-[#334154]">
        {timezoneOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer ${
              value === option.value
                ? 'bg-[#6A7282] text-white dark:bg-[#6A7282]/20'
                : ''
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
