import { DarbeButton } from "../buttons/DarbeButton";

interface IndividualCauseProps {
  id: string;
  name: string;
  description: string;
  active: boolean;
  isBlue: boolean;
  disabled: boolean;
  onClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Individualcause = ({
  id,
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
      dataAttributes={{ "data-cause-id": id }}
    />
  );
};
