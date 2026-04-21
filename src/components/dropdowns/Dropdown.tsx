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
  isValid?: boolean;
  showClearOption?: boolean;
  variant?: "rosterDropdown" | "availabilityModal" | "internalEventTime" | "default";
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
  isValid,
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
  const isInternalEventTime = variant === "internalEventTime";

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
              sx: isInternalEventTime
                ? {
                    maxHeight: 170,
                    mt: 0.5,
                    border: "2px solid #263238",
                    borderRadius: "8px",
                    boxShadow: "none",
                    "& .MuiList-root": {
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "8px 10px",
                    },
                    "& .MuiMenuItem-root": {
                      minHeight: "20px",
                      padding: "0 8px",
                      borderRadius: "8px",
                      color: "#717070",
                      fontSize: "16px",
                      lineHeight: "22px",
                    },
                    "& .MuiMenuItem-root.Mui-selected": {
                      color: "#fff",
                      backgroundColor: "#263238",
                    },
                    "& .MuiMenuItem-root.Mui-selected:hover": {
                      color: "#fff",
                      backgroundColor: "#263238",
                    },
                  }
                : isAvailabilityModal
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
            isInternalEventTime
              ? {
                  ...DropdownSx,
                  height: "30px",
                  borderRadius: "4px",
                  color: "#717070",
                  backgroundColor: "#fff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "2px solid #D8D8D8",
                    borderColor: isValid ? "#088F26" : "#D8D8D8",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isValid ? "#088F26" : "#D8D8D8",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#263238",
                  },
                  "& .MuiSelect-select": {
                    padding: "4px 32px 4px 16px",
                    color: isValid ? "#000" : "#717070",
                    fontSize: "14px",
                    lineHeight: "20px",
                  },
                  "& .MuiSelect-icon": {
                    color: "#263238",
                    right: "8px",
                  },
                }
              : isAvailabilityModal
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
                  "&.Mui-disabled": {
                    color: "#717070",
                    backgroundColor: "#D8D8D8",
                  },
                  "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D8D8D8",
                  },
                  "&.Mui-disabled .MuiSelect-icon": {
                    color: "#717070",
                  },
                }
              : { ...DropdownSx, color: variantTextColor }
          }
        >
          {showClearOption && (
            <MenuItem value="" onClick={() => setDropdownValue("")}>
              &nbsp;
            </MenuItem>
          )}
          {children}
        </Select>
        {error && <FormHelperText>{errorHelperText}</FormHelperText>}
      </FormControl>
    </div>
  );
};
