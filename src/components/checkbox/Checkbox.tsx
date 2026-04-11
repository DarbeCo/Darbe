import { Checkbox, InputLabel } from "@mui/material";

import styles from "./styles/checkbox.module.css";

interface CheckBoxProps {
  defaultChecked?: boolean;
  /** Controlled checked state. When present, the checkbox becomes controlled. */
  checked?: boolean;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  textVariant?: "bold";
  /** Where the text goes */
  labelPlacement: "right" | "left" | "top" | "bottom";
  name: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;
  /** Where to horizontally place the checkbox within the container, can be reversed depending on label placement */
  boxPlacement?: "right" | "left";
  id?: string;
}

export const CheckBox = ({
  defaultChecked,
  checked,
  label,
  onChange,
  labelPlacement,
  boxPlacement,
  name,
  required,
  textVariant,
  disabled,
  icon,
  checkedIcon,
  id,
}: CheckBoxProps) => {
  const checkboxLayouts = {
    right: styles.darbeCheckBoxLabelRight,
    left: styles.darbeCheckBoxLabelLeft,
    top: styles.darbeCheckBoxLabelTop,
    bottom: styles.darbeCheckBoxLabelBottom,
  };

  const boxPlacementLayouts = {
    right: styles.darbeCheckBoxRight,
    left: styles.darbeCheckBoxLeft,
  };

  const stylesLayout = checkboxLayouts[labelPlacement];
  const boxPlacementLayout = boxPlacement
    ? boxPlacementLayouts[boxPlacement]
    : "";
  const fontWeight = textVariant ? 700 : 500;
  const checkboxLabelSx = {
    color: "black",
    fontSize: "14px",
    fontWeight,
    display: "flex",
  };

  const combinedLayouts = `${stylesLayout} ${boxPlacementLayout}`;

  return (
    <div className={combinedLayouts}>
      <InputLabel id={id} sx={checkboxLabelSx}>
        {label}
      </InputLabel>
      <Checkbox
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
        required={required}
        disabled={disabled}
        icon={icon}
        checkedIcon={checkedIcon}
        id={id}
      />
    </div>
  );
};
