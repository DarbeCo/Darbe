import { DarbeButton } from "../buttons/DarbeButton";

interface IndividualCauseProps {
  name: string;
  description: string;
  active: boolean;
  isBlue: boolean;
  disabled: boolean;
  onClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Individualcause = ({
  name,
  disabled,
  isBlue,
  onClick,
}: IndividualCauseProps) => {
  const causesType = isBlue ? "causesButtonBlue" : "causesButton";
  return (
    <DarbeButton
      isDisabled={disabled}
      buttonText={name}
      darbeButtonType={causesType}
      onClick={onClick}
    />
  );
};
