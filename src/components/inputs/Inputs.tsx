import { useState } from "react";
import { FormControl, FormHelperText, Input, InputLabel } from "@mui/material";
import { standardInput, shortInput, textAreaInput } from "./inputStyles";
import { EndPasswordAdornment } from "./EndPasswordAdornment";

import styles from "./styles/darbeInputs.module.css";

type DarbeInputType = "standardInput" | "shortInput" | "textAreaInput";

interface InputsProps {
  label: string;
  darbeInputType: DarbeInputType;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  isRequired?: boolean;
  defaultValue?: string;
  type?: string;
  isDisabled?: boolean;
  isTextArea?: boolean;
  placeholder?: string;
  value?: string | number;
  error?: boolean;
  errorHelperText?: string;
}

export const Inputs = ({
  label,
  darbeInputType,
  handleChange,
  name,
  isRequired,
  defaultValue,
  type,
  isDisabled,
  isTextArea,
  placeholder,
  value,
  error,
  errorHelperText,
}: InputsProps) => {
  const [inputType, setInputType] = useState(type);
  const sxDefinitions: Record<DarbeInputType, object> = {
    standardInput,
    shortInput,
    textAreaInput,
  };
  const darbeInputSx = sxDefinitions[darbeInputType];
  const isPassword = type === "password";

  const showPasswordText = () => {
    setInputType((prev) => (prev === "password" ? "text" : "password"));
  };

  return (
    <div className={styles.darbeInputs}>
      <FormControl error={!!error} sx={{ width: "100%" }} required={isRequired}>
        {label ? (
          <InputLabel
            id={name}
            shrink
            sx={{
              fontSize: "20px",
              transform: "translateX(0px) translateY(-12px)",
            }}
          >
            {label}
          </InputLabel>
        ) : null}
        <Input
          error={!!error}
          value={value}
          name={name}
          onChange={handleChange}
          required={isRequired}
          defaultValue={defaultValue}
          type={inputType}
          disabled={isDisabled}
          sx={darbeInputSx}
          multiline={isTextArea}
          placeholder={placeholder}
          disableUnderline
          endAdornment={
            isPassword ? (
              <EndPasswordAdornment showPasswordText={showPasswordText} />
            ) : null
          }
        />
        {error && (
          <FormHelperText error={!!error}>{errorHelperText}</FormHelperText>
        )}
      </FormControl>
    </div>
  );
};
