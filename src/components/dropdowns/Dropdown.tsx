import React, { ReactNode, useState } from "react";
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
  variant?: "rosterDropdown" | "default";
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
  const [dropdownValue, setDropdownValue] = useState<string | undefined>("");

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
      : styles.defaultDropdown;
  const variantTextColor = variant === "rosterDropdown" ? "white" : "black";

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
              style: {
                maxHeight: 300,
              },
            },
          }}
          value={initialValue ?? dropdownValue}
          onChange={handleChange}
          displayEmpty={displayEmpty}
          disabled={disabled}
          autoWidth={autoWidth}
          name={name}
          label={label}
          id={id}
          sx={{ ...DropdownSx, color: variantTextColor }}
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
