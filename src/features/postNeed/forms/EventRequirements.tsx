import { EventFormCommonProps } from "../types";

import styles from "../styles/postNeed.module.css";
import { Inputs } from "../../../components/inputs/Inputs";

export const EventRequirements = ({
  data,
  eventType,
  onChange,
}: EventFormCommonProps) => {
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

  if (eventType === "internalEvent") {
    const { eventRequirements } = data;
    const fieldClass = (value: string, extraClass: string) =>
      [
        styles.internalRequirementField,
        extraClass,
        value ? styles.internalRequirementValidField : "",
      ]
        .filter(Boolean)
        .join(" ");

    return (
      <div className={styles.internalRequirementsForm}>
        <label
          className={fieldClass(
            eventRequirements.supplies,
            styles.internalRequirementLargeField,
          )}
        >
          <span className={styles.internalRequirementLabel}>What to Bring</span>
          <Inputs
            label=""
            darbeInputType="textAreaInput"
            name="supplies"
            value={eventRequirements.supplies}
            handleChange={handleChange}
            placeholder="Gloves, masks, pens..."
            isTextArea
          />
        </label>

        <label
          className={fieldClass(
            eventRequirements.attire,
            styles.internalRequirementLargeField,
          )}
        >
          <span className={styles.internalRequirementLabel}>Attire</span>
          <Inputs
            label=""
            darbeInputType="textAreaInput"
            name="attire"
            value={eventRequirements.attire}
            handleChange={handleChange}
            placeholder="Wear comfortable clothes and closed shoes. No open toed shoes allowed..."
            isTextArea
          />
        </label>

        <label
          className={fieldClass(
            eventRequirements.ageRestrictions,
            styles.internalRequirementSmallField,
          )}
        >
          <span className={styles.internalRequirementLabel}>
            Age Restriction
          </span>
          <Inputs
            label=""
            darbeInputType="standardInput"
            name="ageRestrictions"
            value={eventRequirements.ageRestrictions}
            handleChange={handleChange}
            placeholder="Must be 18 to participate."
          />
        </label>

        <label
          className={fieldClass(
            eventRequirements.liftRequirements,
            styles.internalRequirementSmallField,
          )}
        >
          <span className={styles.internalRequirementLabel}>
            Lift Requirements
          </span>
          <Inputs
            label=""
            darbeInputType="standardInput"
            name="liftRequirements"
            value={eventRequirements.liftRequirements}
            handleChange={handleChange}
            placeholder="20 lbs"
          />
        </label>
      </div>
    );
  }

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
