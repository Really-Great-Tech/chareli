import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useSystemConfigByKey } from "../../backend/configuration.service";
import { Loader2 } from "lucide-react";

export interface BulkFreeTimeConfigurationRef {
  getSettings: () => {
    defaultFreeTime: number;
    disableFreeTimeForGuests: boolean;
  };
}

interface BulkFreeTimeConfigurationProps {
  disabled?: boolean;
}

const BulkFreeTimeConfiguration = forwardRef<
  BulkFreeTimeConfigurationRef,
  BulkFreeTimeConfigurationProps
>(({ disabled }, ref) => {
  const [defaultFreeTime, setDefaultFreeTime] = useState(0);
  const [disableFreeTimeForGuests, setDisableFreeTimeForGuests] =
    useState(false);

  const { data: configData, isLoading } = useSystemConfigByKey(
    "bulk_free_time_settings"
  );

  useEffect(() => {
    if (configData?.value?.defaultFreeTime !== undefined) {
      setDefaultFreeTime(configData.value.defaultFreeTime);
    }
    if (configData?.value?.disableFreeTimeForGuests !== undefined) {
      setDisableFreeTimeForGuests(configData.value.disableFreeTimeForGuests);
    }
  }, [configData]);

  useImperativeHandle(ref, () => ({
    getSettings: () => ({
      defaultFreeTime,
      disableFreeTimeForGuests,
    }),
  }));

  if (isLoading) {
    return (
      <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#6A7282]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-worksans text-[#6A7282] dark:text-white">
          Free Game Time Configuration
        </h2>
        {configData?.value?.defaultFreeTime !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Current:{" "}
              {configData?.value?.disableFreeTimeForGuests
                ? "Unlimited"
                : configData.value.defaultFreeTime}{" "}
              mins
            </span>
          </div>
        )}
      </div>
      <div className="space-y-6">
        <div>
          <Label
            htmlFor="default-free-time"
            className="text-base font-medium text-black dark:text-white mb-2 block"
          >
            Free Time (minutes)
          </Label>
          <Input
            id="default-free-time"
            type="number"
            min="0"
            value={defaultFreeTime}
            onChange={(e) => setDefaultFreeTime(parseInt(e.target.value) || 0)}
            disabled={disabled || disableFreeTimeForGuests}
            className="max-w-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
            placeholder="e.g. 30"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Will update all existing games when you save
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="disable-free-time-guests"
            checked={disableFreeTimeForGuests}
            onCheckedChange={(checked) =>
              setDisableFreeTimeForGuests(checked === true)
            }
            disabled={disabled}
            color="#6A7282"
          />
          <Label
            htmlFor="disable-free-time-guests"
            className="text-base font-medium text-black dark:text-white cursor-pointer"
          >
            Disable free time for guests (unlimited gameplay for
            non-authenticated users)
          </Label>
        </div>
        {disableFreeTimeForGuests && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
            When enabled, users who haven't signed in will have unlimited
            gameplay time
          </p>
        )}
      </div>
    </div>
  );
});

BulkFreeTimeConfiguration.displayName = "BulkFreeTimeConfiguration";

export default BulkFreeTimeConfiguration;
