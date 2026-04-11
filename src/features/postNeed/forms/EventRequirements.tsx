import { EventFormCommonProps } from "../types";

import styles from "../styles/postNeed.module.css";
import { Inputs } from "../../../components/inputs/Inputs";

export const EventRequirements = ({ data, onChange }: EventFormCommonProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;
      onChange((prevState) => ({
        ...prevState,
        eventRequirements: {
          ...prevState.eventRequirements,
          [name]: value,
        },
      }));
    }
  };

  return (
    <div className={styles.eventFormArea}>
      <Inputs
        label="What to Bring"
        darbeInputType="textAreaInput"
        name="supplies"
        value={data.eventRequirements.supplies}
        handleChange={handleChange}
        placeholder="List of items to bring"
      />

      <Inputs
        label="Age Restrictions"
        darbeInputType="standardInput"
        name="ageRestrictions"
        value={data.eventRequirements.ageRestrictions}
        handleChange={handleChange}
        placeholder="Age restrictions"
      />

      <Inputs
        label="Attire"
        darbeInputType="standardInput"
        name="attire"
        value={data.eventRequirements.attire}
        handleChange={handleChange}
        placeholder="Dress code"
      />

      <Inputs
        label="Lift Requirements"
        darbeInputType="standardInput"
        name="liftRequirements"
        value={data.eventRequirements.liftRequirements}
        handleChange={handleChange}
        placeholder="Lift requirements"
      />
    </div>
  );
};
