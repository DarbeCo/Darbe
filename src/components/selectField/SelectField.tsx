import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { UserAvatars } from "../avatars/UserAvatars";
import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (event: SelectChangeEvent<string>, child?: React.ReactNode) => void;
  options?: SimpleUserInfo[];
}

// TODO: Test the types coming in can be properly set depending on the user
const SelectField = ({ label, options, value, onChange }: SelectFieldProps) => (
  <FormControl fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select value={value} label={label} onChange={onChange}>
      {options?.map((option, key) => (
        <MenuItem key={key} value={option.id}>
          <UserAvatars {...option} />{" "}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default SelectField;
