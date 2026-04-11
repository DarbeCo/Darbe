import { Dispatch, SetStateAction } from "react";

import { CreateEvent } from "../../../../services/api/endpoints/types/events.api.types";
import { Inputs } from "../../../../components/inputs/Inputs";
import { splitStringndCapitalize } from "../../../../utils/CommonFunctions";
import { ClosingIcon } from "../../../../components/closingIcon/ClosingIcon";

import styles from "./styles/subForms.module.css";

interface WaiverFormProps {
  waiverType: string;
  onChange?: Dispatch<SetStateAction<CreateEvent>>;
  handleClose: () => void;
  adultWaiver?: string;
  minorWaiver?: string;
}

export const WaiverForm = ({
  waiverType,
  onChange,
  handleClose,
  adultWaiver,
  minorWaiver,
}: WaiverFormProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;
      onChange((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const waiverText = splitStringndCapitalize(waiverType, true);
  const waiverName =
    waiverType === "adultWaiver" ? "adultWaiver" : "minorWaiver";

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <div className={styles.modalContentHeader}>
          <ClosingIcon onClick={handleClose} />
        </div>
        <Inputs
          label={`Upload ${waiverText} Waiver`}
          darbeInputType="textAreaInput"
          value={waiverType === "adultWaiver" ? adultWaiver : minorWaiver}
          handleChange={handleChange}
          name={waiverName}
          placeholder={`Enter ${waiverText} Waiver`}
        />
      </div>
    </div>
  );
};
