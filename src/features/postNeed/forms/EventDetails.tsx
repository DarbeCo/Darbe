import { useState } from "react";
import { RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";
import { CircularProgress, IconButton } from "@mui/material";

import { EventFormCommonProps } from "../types";
import { CheckBox } from "../../../components/checkbox/Checkbox";
import { Inputs } from "../../../components/inputs/Inputs";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { FileUpload } from "../../../components/fileUpload/FileUpload";
import { FilePreviews } from "../../../components/fileUpload/FilePreviews";
import { convertFileToBase64 } from "../../../utils/CommonFunctions";
import { Typography } from "../../../components/typography/Typography";
import { DarbeButton } from "../../../components/buttons/DarbeButton";
import { useModal } from "../../../utils/commonHooks/UseModal";
import SelectField from "../../../components/selectField/SelectField";
import { useGetRosterAdminsQuery } from "../../../services/api/endpoints/roster/roster.api";
import { WaiverForm } from "./subForms/WaiverForm";

import styles from "../styles/postNeed.module.css";

export const EventDetails = ({ data, onChange }: EventFormCommonProps) => {
  const [imagePreview, setImagePreview] = useState<File | null>();
  const [waiverType, setWaiverType] = useState<string>("");
  const { data: rosterMembers, isLoading } = useGetRosterAdminsQuery();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, checked } = e.target;
      onChange((prevState) => {
        // When one option is checked, ensure the other is unchecked
        const updatedVolunteerImpact = {
          ...prevState.volunteerImpact,
          [name]: checked,
        };

        if (checked) {
          if (name === "isIndividualImpact") {
            updatedVolunteerImpact.isGroupImpact = false;
          } else if (name === "isGroupImpact") {
            updatedVolunteerImpact.isIndividualImpact = false;
          }
        }

        return {
          ...prevState,
          volunteerImpact: updatedVolunteerImpact,
        };
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;
      onChange((prevState) => ({
        ...prevState,
        volunteerImpact: {
          ...prevState.volunteerImpact,
          [name]: value,
        },
      }));
    }
  };

  const handleFileUploads = async (files: File[]) => {
    setImagePreview(files[0]);
    if (onChange) {
      const fileConverted = await convertFileToBase64(files[0]);
      onChange((prevState) => ({
        ...prevState,
        eventCoverPhoto: fileConverted,
      }));
    }
  };

  const handleRemovingImage = () => {
    setImagePreview(null);
    if (onChange) {
      onChange((prevState) => ({
        ...prevState,
        eventCoverPhoto: "",
      }));
    }
  };

  const handleSetWaiverType = (type: string) => {
    setWaiverType(type);
  };

  const handleWaiverClick = (waiverType: string) => {
    handleSetWaiverType(waiverType);
    showWaiverPopup();
  };

  const {
    isVisible: isWaiverPopupVisible,
    show: showWaiverPopup,
    toggle: toggleWaiverPopup,
  } = useModal();

  const hasImagePreview = imagePreview || data.eventCoverPhoto;

  // TODO: Kinda wack, maybe utils or change how we render previews?
  const base64ToFile = (
    base64String: string | undefined,
    fileName: string
  ): File => {
    if (!base64String) {
      return new File([], fileName);
    }
    // Decode the base64 string to a binary string
    const byteString = atob(base64String.split(",")[1]);

    // Create an array buffer and a view to hold the binary data
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    // Populate the view with the binary data
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    // Create a Blob from the array buffer
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

    // Create a File from the Blob
    const file = new File([blob], fileName, { type: "image/jpeg" });

    return file;
  };

  const converPreviewToFile = () => {
    let imageString;

    if (imagePreview) {
      return imagePreview;
    } else {
      imageString = base64ToFile(data.eventCoverPhoto, "previewEvent");
    }

    return imageString;
  };

  const imagePreviewUrl = converPreviewToFile();

  return (
    <div className={styles.eventFormArea}>
      <div className={styles.eventCoverPhoto}>
        {hasImagePreview && (
          <IconButton
            onClick={handleRemovingImage}
            sx={{
              position: "relative",
              gridRow: "1",
              gridColumn: "1",
              left: 170,
              zIndex: 1,
            }}
          >
            <CustomSvgs
              svgPath="/svgs/common/removeItemIcon.svg"
              altText="Add Cover Photo Icon"
            />
          </IconButton>
        )}
        <FilePreviews
          nonPostMode
          isEventPhoto
          uploadedFiles={imagePreviewUrl ? [imagePreviewUrl] : []}
          handleRemovingImage={handleRemovingImage}
        />
        {!hasImagePreview && (
          <FileUpload handleFileUploads={handleFileUploads} />
        )}
      </div>
      <div className={styles.eventCoordinator}>
        {isLoading && <CircularProgress />}
        <SelectField
          label="Event Coordinator"
          options={rosterMembers}
          value={data.eventCoordinator || ""}
          onChange={(event) => {
            onChange?.((prevState) => ({
              ...prevState,
              eventCoordinator: event.target.value,
            }));
          }}
        />
      </div>

      <div className={styles.volunteerImpact}>
        <div className={styles.checkBoxInputsArea}>
          <CheckBox
            name="isIndividualImpact"
            label="Individual Impact (per hour)"
            labelPlacement="right"
            textVariant="bold"
            checked={!!data.volunteerImpact.isIndividualImpact}
            icon={<RadioButtonUnchecked />}
            checkedIcon={<RadioButtonChecked />}
            onChange={handleCheckboxChange}
          />
          {data.volunteerImpact.isIndividualImpact && (
            <div className={styles.checkBoxInputs}>
              <Inputs
                label=""
                name="individualImpactPerHour"
                darbeInputType="shortInput"
                placeholder="1"
                value={data.volunteerImpact.individualImpactPerHour}
                handleChange={handleChange}
              />
              <Inputs
                label=""
                name="individualImpact"
                darbeInputType="standardInput"
                placeholder="dog washed"
                value={data.volunteerImpact.individualImpact}
                handleChange={handleChange}
              />
            </div>
          )}
        </div>

        <div className={styles.checkBoxInputsArea}>
          <CheckBox
            name="isGroupImpact"
            label="Group Impact (per hour)"
            labelPlacement="right"
            textVariant="bold"
            checked={!!data.volunteerImpact.isGroupImpact}
            icon={<RadioButtonUnchecked />}
            checkedIcon={<RadioButtonChecked />}
            onChange={handleCheckboxChange}
          />
          {data.volunteerImpact.isGroupImpact && (
            <div className={styles.checkBoxInputs}>
              <Inputs
                label=""
                name="groupImpactPerHour"
                darbeInputType="shortInput"
                placeholder="5"
                value={data.volunteerImpact.groupImpactPerHour}
                handleChange={handleChange}
              />
              <Inputs
                label=""
                name="groupImpact"
                darbeInputType="standardInput"
                placeholder="dogs walked"
                value={data.volunteerImpact.groupImpact}
                handleChange={handleChange}
              />
            </div>
          )}
        </div>

        <Typography
          variant="sectionTitle"
          textToDisplay="Attach Waivers (if applicable)"
          extraClass="paddingTop paddingBottom"
        />

        <div className={styles.waiverArea}>
          <div className={styles.waiverSection}>
            <Typography variant="sectionTitle" textToDisplay="Adult Waiver" />
            <DarbeButton
              onClick={() => handleWaiverClick("adultWaiver")}
              darbeButtonType="postButton"
              buttonText="Upload"
            />
          </div>
          <div className={styles.waiverSection}>
            <Typography variant="sectionTitle" textToDisplay="Minor Waiver" />
            <DarbeButton
              onClick={() => handleWaiverClick("minorWaiver")}
              darbeButtonType="postButton"
              buttonText="Upload"
            />
          </div>
        </div>
      </div>
      {isWaiverPopupVisible && (
        <WaiverForm
          adultWaiver={data.adultWaiver}
          minorWaiver={data.minorWaiver}
          waiverType={waiverType}
          onChange={onChange}
          handleClose={toggleWaiverPopup}
        />
      )}
    </div>
  );
};
