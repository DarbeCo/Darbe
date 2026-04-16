import React, { ReactNode, useEffect, useState } from "react";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

import { DropdownSx } from "./types";

import styles from "./styles/dropdown.module.css";

interface DropdownProps {
  name: string;
  children: ReactNode;
  id?: string;
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  displayEmpty?: boolean;
  disabled?: boolean;
  autoWidth?: boolean;
  initialValue?: string;
  error?: boolean;
  errorHelperText?: string;
  showClearOption?: boolean;
  variant?: "rosterDropdown" | "availabilityModal" | "default";
}

export const Dropdown = ({
  name,
  children,
  id,
  label,
  onChange,
  displayEmpty,
  disabled,
  autoWidth,
  initialValue,
  error,
  errorHelperText,
  showClearOption = false,
  variant = "default",
}: DropdownProps) => {
  const [dropdownValue, setDropdownValue] = useState<string | undefined>(
    initialValue ?? ""
  );

  useEffect(() => {
    setDropdownValue(initialValue ?? "");
  }, [initialValue]);

  const handleChange = (event: SelectChangeEvent) => {
    setDropdownValue(event.target.value.toString());
    if (onChange) {
      onChange(event as unknown as React.ChangeEvent<HTMLSelectElement>);
    }
  };

  // TODO: Move these out of here. Either do no variants on this, or idk its not great
  const className =
    variant === "rosterDropdown"
      ? styles.rosterDropdown
      : variant === "availabilityModal"
        ? styles.availabilityModalDropdown
      : styles.defaultDropdown;
  const variantTextColor = variant === "rosterDropdown" ? "white" : "black";
  const currentValue = dropdownValue ?? "";
  const hasValue = currentValue !== "";
  const isAvailabilityModal = variant === "availabilityModal";

  return (
    <div className={className}>
      <FormControl fullWidth error={!!error}>
        <InputLabel
          id={id}
          shrink
          sx={{
            fontSize: "20px",
            transform: "translateX(0px) translateY(-24px)",
          }}
        >
          {label}
        </InputLabel>
        <Select
          MenuProps={{
            PaperProps: {
              sx: isAvailabilityModal
                ? {
                    maxHeight: 220,
                    border: "2px solid #263238",
                    borderRadius: "8px",
                    boxShadow: "none",
                  }
                : {
                    maxHeight: 300,
                  },
            },
          }}
          value={currentValue}
          onChange={handleChange}
          displayEmpty={displayEmpty}
          disabled={disabled}
          autoWidth={autoWidth}
          name={name}
          label={label}
          id={id}
          sx={
            isAvailabilityModal
              ? {
                  ...DropdownSx,
                  border: "2px solid #D8D8D8",
                  borderRadius: "8px",
                  minWidth: "92px",
                  width: "100%",
                  height: "42px",
                  color: "#2f3941",
                  backgroundColor: "#fff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "2px solid",
                    borderColor: hasValue ? "#088F26" : "#D8D8D8",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: hasValue ? "#088F26" : "#D8D8D8",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#263238",
                  },
                  "& .MuiSelect-select": {
                    padding: "8px 40px 8px 12px",
                    fontSize: "15px",
                    lineHeight: 1.2,
                  },
                  "& .MuiSelect-icon": {
                    color: "#5f6770",
                    right: "12px",
                  },
                }
              : { ...DropdownSx, color: variantTextColor }
          }
        >
          {children}
          {showClearOption && (
            <MenuItem value="" onClick={() => setDropdownValue("")}>
              None
            </MenuItem>
          )}
        </Select>
        {error && <FormHelperText>{errorHelperText}</FormHelperText>}
      </FormControl>
    </div>
  );
};
