"use client";

import * as React from "react";
import Select from "react-select";
import "../../styles/react-select-theme.css";

export interface MultiSelectProps {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelect = React.forwardRef<any, MultiSelectProps>(
  (
    {
      value = [],
      onValueChange,
      options,
      placeholder = "Select options...",
      searchPlaceholder,
      emptyText = "No options found",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const selectedOptions = options.filter((option) => value.includes(option.value));

    return (
      <Select
        ref={ref}
        value={selectedOptions}
        onChange={(selectedOptions) => {
          const values = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
          onValueChange?.(values);
        }}
        options={options}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={true}
        isMulti={true}
        isDisabled={disabled}
        noOptionsMessage={() => emptyText}
        className={`react-select-container ${className || ""}`}
        classNamePrefix="react-select"
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: '#DC8B18',
            primary75: '#DC8B18',
            primary50: '#FFF7ED',
            primary25: '#FFF7ED',
          },
        })}
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 10001,
          }),
          menuList: (provided) => ({
            ...provided,
            maxHeight: '200px',
          }),
          multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#DC8B18',
            borderRadius: '6px',
          }),
          multiValueLabel: (provided) => ({
            ...provided,
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
          }),
          multiValueRemove: (provided) => ({
            ...provided,
            color: 'white',
            backgroundColor: 'transparent',
            ':hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
            },
            cursor: 'pointer',
            borderRadius: '0 6px 6px 0',
          }),
        }}
        {...props}
      />
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
