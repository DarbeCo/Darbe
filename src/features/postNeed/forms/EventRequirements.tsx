import { EventFormCommonProps } from "../types";

import styles from "../styles/postNeed.module.css";
import { Inputs } from "../../../components/inputs/Inputs";

export const EventRequirements = ({
  data,
  eventType,
  onChange,
}: EventFormCommonProps) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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

  const { eventRequirements } = data;
  const isCommunityEvent = eventType === "externalEvent";
  const ageRestrictionOptions = Array.from({ length: 9 }, (_, index) => {
    const age = index + 10;
    return `Volunteer must be at least ${age} Yrs Old`;
  });
  const fieldClass = (value: string, extraClass: string) =>
    [
      styles.internalRequirementField,
      extraClass,
      value ? styles.internalRequirementValidField : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div
      className={`${styles.internalRequirementsForm} ${
        isCommunityEvent ? styles.communityRequirementsForm : ""
      }`}
    >
      <label
        className={fieldClass(
          eventRequirements.supplies,
          `${styles.internalRequirementLargeField} ${styles.requirementSuppliesField}`,
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
          `${styles.internalRequirementLargeField} ${styles.requirementAttireField}`,
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
          `${styles.internalRequirementSmallField} ${styles.requirementAgeField}`,
        )}
      >
        <span className={styles.internalRequirementLabel}>Age Restriction</span>
        <select
          className={`${styles.internalRequirementSelect} ${
            eventRequirements.ageRestrictions
              ? styles.internalRequirementSelectFilled
              : ""
          }`.trim()}
          name="ageRestrictions"
          value={eventRequirements.ageRestrictions}
          onChange={handleChange}
        >
          <option value="">Select age restriction</option>
          {ageRestrictionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label
        className={fieldClass(
          eventRequirements.liftRequirements,
          `${styles.internalRequirementSmallField} ${styles.requirementLiftField}`,
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
};
