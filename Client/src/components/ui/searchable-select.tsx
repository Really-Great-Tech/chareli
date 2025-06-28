"use client";

import * as React from "react";
import Select from "react-select";
import "../../styles/react-select-theme.css";

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

const SearchableSelect = React.forwardRef<any, SearchableSelectProps>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = "Select option...",
      searchPlaceholder,
      emptyText = "No options found",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const selectedOption = options.find((option) => option.value === value);

    return (
      <Select
        ref={ref}
        value={selectedOption || null}
        onChange={(selectedOption) => {
          onValueChange?.(selectedOption?.value || "");
        }}
        options={options}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={true}
        isDisabled={disabled}
        noOptionsMessage={() => emptyText}
        className={`react-select-container ${className || ""}`}
        classNamePrefix="react-select"
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: '#D946EF',
            primary75: '#D946EF',
            primary50: '#F3E8FF',
            primary25: '#F3E8FF',
          },
        })}
        {...props}
      />
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };
