"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface SearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

const SearchableSelect = React.forwardRef<
  React.ElementRef<typeof Button>,
  SearchableSelectProps
>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = "Select option...",
      searchPlaceholder = "Search...",
      emptyText = "No option found.",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !selectedOption && "text-muted-foreground",
              className
            )}
            {...props}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popper-anchor-width] min-w-[200px] max-w-[calc(100vw-2rem)] p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-[250px] overflow-y-auto">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {/* Clear option */}
                <CommandItem
                  className="cursor-pointer"
                  onSelect={() => {
                    onValueChange?.("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "" || !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {placeholder}
                </CommandItem>
                {/* Options */}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer"
                    onSelect={() => {
                      onValueChange?.(option.value === value ? "" : option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };
