import { useEffect, useMemo, useRef, useState } from "react";
import {
  AddCircleOutline,
  InfoOutlined,
  KeyboardArrowDown,
  RadioButtonChecked,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";

import { EventFormCommonProps } from "../types";
import { Inputs } from "../../../components/inputs/Inputs";
import { convertFileToBase64 } from "../../../utils/CommonFunctions";
import {
  useGetRosterAdminsQuery,
  useGetRostersQuery,
} from "../../../services/api/endpoints/roster/roster.api";
import { assetUrl } from "../../../utils/assetUrl";

import styles from "../styles/postNeed.module.css";

export const EventDetails = ({
  data,
  eventType,
  onChange,
}: EventFormCommonProps) => {
  const [imagePreview, setImagePreview] = useState<File | null>();
  const internalPhotoInputRef = useRef<HTMLInputElement>(null);
  const adultWaiverInputRef = useRef<HTMLInputElement>(null);
  const minorWaiverInputRef = useRef<HTMLInputElement>(null);
  const [selectedRosterId, setSelectedRosterId] = useState("");
  const [isInviteDropdownOpen, setIsInviteDropdownOpen] = useState(false);
  const [isCoordinatorDropdownOpen, setIsCoordinatorDropdownOpen] =
    useState(false);
  const { data: rosterMembers, isLoading } = useGetRosterAdminsQuery();
  const { data: rosters } = useGetRostersQuery();

  const inviteRosterGroups = useMemo(
    () =>
      [...(rosters ?? [])].sort((firstRoster, secondRoster) =>
        firstRoster.rosterName.localeCompare(secondRoster.rosterName),
      ),
    [rosters],
  );

  const selectedRoster = inviteRosterGroups.find(
    (roster) => roster.id === selectedRosterId,
  );

  const selectedRosterDisplayText =
    selectedRoster?.rosterName || "Select roster group";

  useEffect(() => {
    if (!data.eventCoordinator && rosterMembers?.[0]?.id) {
      onChange?.((prevState) => ({
        ...prevState,
        eventCoordinator: rosterMembers[0].id,
      }));
    }
  }, [data.eventCoordinator, onChange, rosterMembers]);

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

  const handleInviteRosterSelect = (rosterId: string) => {
    setSelectedRosterId(rosterId);
    setIsInviteDropdownOpen(false);
  };

  const handleCoordinatorSelect = (coordinatorId: string) => {
    onChange?.((prevState) => ({
      ...prevState,
      eventCoordinator: coordinatorId,
    }));
    setIsCoordinatorDropdownOpen(false);
  };

  const handleWaiverClick = (waiverType: "adultWaiver" | "minorWaiver") => {
    if (waiverType === "adultWaiver") {
      adultWaiverInputRef.current?.click();
      return;
    }

    minorWaiverInputRef.current?.click();
  };

  const handleWaiverFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    waiverType: "adultWaiver" | "minorWaiver",
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const fileConverted = await convertFileToBase64(file);

    onChange?.((prevState) => ({
      ...prevState,
      [waiverType]: fileConverted,
    }));

    event.target.value = "";
  };

  const handleRemoveWaiver = (waiverType: "adultWaiver" | "minorWaiver") => {
    onChange?.((prevState) => ({
      ...prevState,
      [waiverType]: "",
    }));
  };

  const renderWaiverFileInputs = () => (
    <>
      <input
        ref={adultWaiverInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
        hidden
        onChange={(event) => handleWaiverFileChange(event, "adultWaiver")}
      />
      <input
        ref={minorWaiverInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
        hidden
        onChange={(event) => handleWaiverFileChange(event, "minorWaiver")}
      />
    </>
  );

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

  const selectedCoordinator =
    rosterMembers?.find((member) => member.id === data.eventCoordinator) ||
    rosterMembers?.[0];
  const selectedCoordinatorName =
    selectedCoordinator?.fullName ||
    selectedCoordinator?.organizationName ||
    selectedCoordinator?.nonprofitName ||
    "John Doe";
  const defaultProfilePicture = assetUrl("/images/defaultProfilePicture.jpg");
  const selectedCoordinatorProfilePicture =
    selectedCoordinator?.profilePicture || defaultProfilePicture;

  const handleInternalPhotoClick = () => {
    internalPhotoInputRef.current?.click();
  };

  const handleInternalPhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;

    if (files?.length) {
      handleFileUploads(Array.from(files));
    }
  };

  const renderInternalImpactOption = ({
    amountName,
    amountPlaceholder,
    checked,
    impactName,
    label,
    textPlaceholder,
    toggleName,
  }: {
    amountName: "individualImpactPerHour" | "groupImpactPerHour";
    amountPlaceholder: string;
    checked: boolean;
    impactName: "individualImpact" | "groupImpact";
    label: string;
    textPlaceholder: string;
    toggleName: "isIndividualImpact" | "isGroupImpact";
  }) => {
    const hasValues =
      Boolean(data.volunteerImpact[amountName]) &&
      Boolean(data.volunteerImpact[impactName]);
    const inputGroupClass = [
      styles.internalImpactInputs,
      checked ? styles.internalImpactActiveInputs : "",
      checked && hasValues ? styles.internalImpactValidInputs : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.internalImpactOption}>
        <button
          className={styles.internalImpactRadio}
          type="button"
          onClick={() =>
            handleCheckboxChange({
              target: { checked: !checked, name: toggleName },
            } as React.ChangeEvent<HTMLInputElement>)
          }
        >
          {checked ? (
            <RadioButtonChecked sx={{ color: "#088F26", fontSize: 24 }} />
          ) : (
            <RadioButtonUnchecked sx={{ color: "#263238", fontSize: 24 }} />
          )}
          <span>{label}</span>
        </button>
        <div className={inputGroupClass}>
          <Inputs
            label=""
            name={amountName}
            darbeInputType="standardInput"
            placeholder={amountPlaceholder}
            value={data.volunteerImpact[amountName]}
            handleChange={handleChange}
          />
          <div className={styles.internalImpactTextInput}>
            <Inputs
              label=""
              name={impactName}
              darbeInputType="standardInput"
              placeholder={textPlaceholder}
              value={data.volunteerImpact[impactName]}
              handleChange={handleChange}
            />
            <span>0/150</span>
          </div>
        </div>
      </div>
    );
  };

  const internalPreviewSrc =
    hasImagePreview && imagePreviewUrl ? URL.createObjectURL(imagePreviewUrl) : "";

  if (eventType === "externalEvent") {
    return (
      <div className={`${styles.internalOtherForm} ${styles.communityOtherForm}`}>
        {renderWaiverFileInputs()}
        <section
          className={`${styles.internalCoverSection} ${styles.communityCoverSection}`}
        >
          <span className={styles.internalOtherLabel}>Cover photo</span>
          <div className={styles.internalCoverPhoto}>
            {internalPreviewSrc ? (
              <img src={internalPreviewSrc} alt="Event cover preview" />
            ) : (
              <button
                aria-label="Upload cover photo"
                className={styles.internalCoverUploadButton}
                type="button"
                onClick={handleInternalPhotoClick}
              >
                <AddCircleOutline sx={{ color: "#000", fontSize: 36 }} />
              </button>
            )}
            <input
              ref={internalPhotoInputRef}
              type="file"
              accept=".jpg,.png"
              hidden
              onChange={handleInternalPhotoChange}
            />
          </div>
        </section>

        <section className={styles.communityCoordinatorFields}>
          <div className={styles.internalCoordinatorSection}>
            <span className={styles.internalOtherLabel}>
              Assign Coordinator<span className={styles.requiredIndicator}>*</span>
            </span>
            {isLoading ? (
              <CircularProgress size={24} sx={{ marginTop: "8px" }} />
            ) : (
              <button
                aria-expanded={isCoordinatorDropdownOpen}
                className={`${styles.communityCoordinatorSelect} ${
                  data.eventCoordinator ? styles.communityOtherValidField : ""
                }`}
                type="button"
                onClick={() =>
                  setIsCoordinatorDropdownOpen((isOpen) => !isOpen)
                }
              >
                {selectedCoordinatorName}
              </button>
            )}
            {isCoordinatorDropdownOpen && (
              <div className={styles.internalCoordinatorDropdown}>
                {rosterMembers?.length ? (
                  rosterMembers.map((member) => (
                    <button
                      className={styles.internalCoordinatorDropdownOption}
                      key={member.id}
                      type="button"
                      onClick={() => handleCoordinatorSelect(member.id)}
                    >
                      {member.fullName ||
                        member.organizationName ||
                        member.nonprofitName ||
                        "Roster admin"}
                    </button>
                  ))
                ) : (
                  <span className={styles.internalCoordinatorDropdownEmpty}>
                    No roster admins available
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={`${styles.communityCoordinatorPosition} ${
              data.eventCoordinator ? styles.communityOtherValidField : ""
            }`}
          >
            <span>Volunteer Lead</span>
          </div>
        </section>

        <section className={styles.communityWaiverSection}>
          <span className={styles.internalWaiverTitle}>
            Attach Waivers (if applicable)
          </span>
          <div className={styles.communityWaiverFileRow}>
            <button
              className={styles.communityChooseFileButton}
              onClick={() => handleWaiverClick("adultWaiver")}
              type="button"
            >
              {data.adultWaiver ? "Replace File" : "Choose File"}
            </button>
            {data.adultWaiver && (
              <>
                <span className={styles.waiverUploadedStatus}>Uploaded</span>
                <button
                  className={styles.waiverRemoveButton}
                  type="button"
                  onClick={() => handleRemoveWaiver("adultWaiver")}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </section>

        <section className={styles.internalImpactSection}>
          <div className={styles.internalImpactHeading}>
            <span>
              Volunteer Impact<span className={styles.requiredIndicator}>*</span>
            </span>
            <InfoOutlined sx={{ color: "#2C77E7", fontSize: 12 }} />
          </div>
          <div className={styles.internalImpactOptions}>
            {renderInternalImpactOption({
              amountName: "individualImpactPerHour",
              amountPlaceholder: "1",
              checked: !!data.volunteerImpact.isIndividualImpact,
              impactName: "individualImpact",
              label: "Individual Goal (per hour)",
              textPlaceholder: "Dog washed",
              toggleName: "isIndividualImpact",
            })}
            {renderInternalImpactOption({
              amountName: "groupImpactPerHour",
              amountPlaceholder: "10",
              checked: !!data.volunteerImpact.isGroupImpact,
              impactName: "groupImpact",
              label: "Group Goal (total)",
              textPlaceholder: "Dogs washed",
              toggleName: "isGroupImpact",
            })}
          </div>
        </section>

        <section className={styles.internalInviteSection}>
          <span className={styles.internalOtherLabel}>Invite Roster Members</span>
          <button
            aria-expanded={isInviteDropdownOpen}
            className={[
              styles.internalRosterSelect,
              isInviteDropdownOpen ? styles.internalRosterSelectOpen : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            onClick={() =>
              setIsInviteDropdownOpen((isDropdownOpen) => !isDropdownOpen)
            }
          >
            <span>{selectedRosterDisplayText}</span>
            <KeyboardArrowDown sx={{ color: "#263238", fontSize: 24 }} />
          </button>
          {isInviteDropdownOpen && (
            <div className={styles.internalRosterDropdown}>
              <button
                className={styles.internalRosterDropdownOption}
                type="button"
                onClick={() => handleInviteRosterSelect("")}
              >
                <span>&nbsp;</span>
              </button>
              {inviteRosterGroups.length ? (
                inviteRosterGroups.map((roster) => (
                  <button
                    className={styles.internalRosterDropdownOption}
                    key={roster.id}
                    type="button"
                    onClick={() => handleInviteRosterSelect(roster.id)}
                  >
                    <span>{roster.rosterName}</span>
                  </button>
                ))
              ) : (
                <span className={styles.internalRosterDropdownEmpty}>
                  No roster groups available
                </span>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (eventType === "internalEvent") {
    return (
      <div className={styles.internalOtherForm}>
        {renderWaiverFileInputs()}
        <section className={styles.internalCoverSection}>
          <span className={styles.internalOtherLabel}>Cover photo</span>
          <div className={styles.internalCoverPhoto}>
            {internalPreviewSrc ? (
              <img src={internalPreviewSrc} alt="Event cover preview" />
            ) : (
              <button
                aria-label="Upload cover photo"
                className={styles.internalCoverUploadButton}
                type="button"
                onClick={handleInternalPhotoClick}
              >
                <AddCircleOutline sx={{ color: "#000", fontSize: 36 }} />
              </button>
            )}
            <input
              ref={internalPhotoInputRef}
              type="file"
              accept=".jpg,.png"
              hidden
              onChange={handleInternalPhotoChange}
            />
          </div>
        </section>

        <section className={styles.internalOtherMetaSection}>
          <div className={styles.internalCoordinatorSection}>
            <span className={styles.internalOtherLabel}>Coordinator</span>
            {isLoading ? (
              <CircularProgress size={24} sx={{ marginTop: "8px" }} />
            ) : (
              <button
                aria-expanded={isCoordinatorDropdownOpen}
                className={styles.internalCoordinatorProfile}
                type="button"
                onClick={() =>
                  setIsCoordinatorDropdownOpen((isOpen) => !isOpen)
                }
              >
                <img
                  src={selectedCoordinatorProfilePicture}
                  alt=""
                  aria-hidden="true"
                  onError={(event) => {
                    event.currentTarget.src = defaultProfilePicture;
                  }}
                />
                <div>
                  <strong>{selectedCoordinatorName}</strong>
                  <span>Volunteering at NP</span>
                </div>
                <KeyboardArrowDown sx={{ color: "#263238", fontSize: 24 }} />
              </button>
            )}
            {isCoordinatorDropdownOpen && (
              <div className={styles.internalCoordinatorDropdown}>
                {rosterMembers?.length ? (
                  rosterMembers.map((member) => (
                    <button
                      className={styles.internalCoordinatorDropdownOption}
                      key={member.id}
                      type="button"
                      onClick={() => handleCoordinatorSelect(member.id)}
                    >
                      {member.fullName ||
                        member.organizationName ||
                        member.nonprofitName ||
                        "Roster admin"}
                    </button>
                  ))
                ) : (
                  <span className={styles.internalCoordinatorDropdownEmpty}>
                    No roster admins available
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.internalWaiverBlock}>
            <span className={styles.internalWaiverTitle}>
              Attach Waivers (if applicable)
            </span>
            <div className={styles.internalWaiverOptions}>
              <div>
                <span>Adult Waiver</span>
                <button
                  className={styles.internalWaiverUploadButton}
                  onClick={() => handleWaiverClick("adultWaiver")}
                  type="button"
                >
                  {data.adultWaiver ? "Replace" : "Upload"}
                </button>
                {data.adultWaiver && (
                  <div className={styles.waiverUploadStatusRow}>
                    <span className={styles.waiverUploadedStatus}>
                      Uploaded
                    </span>
                    <button
                      className={styles.waiverRemoveButton}
                      type="button"
                      onClick={() => handleRemoveWaiver("adultWaiver")}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div>
                <span>Child Waiver</span>
                <button
                  className={styles.internalWaiverUploadButton}
                  onClick={() => handleWaiverClick("minorWaiver")}
                  type="button"
                >
                  {data.minorWaiver ? "Replace" : "Upload"}
                </button>
                {data.minorWaiver && (
                  <div className={styles.waiverUploadStatusRow}>
                    <span className={styles.waiverUploadedStatus}>
                      Uploaded
                    </span>
                    <button
                      className={styles.waiverRemoveButton}
                      type="button"
                      onClick={() => handleRemoveWaiver("minorWaiver")}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.internalImpactSection}>
          <div className={styles.internalImpactHeading}>
            <span>
              Event Impact<span className={styles.requiredIndicator}>*</span>
            </span>
            <InfoOutlined sx={{ color: "#2C77E7", fontSize: 12 }} />
          </div>
          <div className={styles.internalImpactOptions}>
            {renderInternalImpactOption({
              amountName: "individualImpactPerHour",
              amountPlaceholder: "1",
              checked: !!data.volunteerImpact.isIndividualImpact,
              impactName: "individualImpact",
              label: "Individual Impact (per hour)",
              textPlaceholder: "Office Work",
              toggleName: "isIndividualImpact",
            })}
            {renderInternalImpactOption({
              amountName: "groupImpactPerHour",
              amountPlaceholder: "10",
              checked: !!data.volunteerImpact.isGroupImpact,
              impactName: "groupImpact",
              label: "Group Impact (total)",
              textPlaceholder: "Office Work",
              toggleName: "isGroupImpact",
            })}
          </div>
        </section>

        <section className={styles.internalInviteSection}>
          <span className={styles.internalOtherLabel}>Invite Roster Members</span>
          <button
            aria-expanded={isInviteDropdownOpen}
            className={[
              styles.internalRosterSelect,
              isInviteDropdownOpen ? styles.internalRosterSelectOpen : "",
            ]
              .filter(Boolean)
              .join(" ")}
            type="button"
            onClick={() =>
              setIsInviteDropdownOpen((isDropdownOpen) => !isDropdownOpen)
            }
          >
            <span>{selectedRosterDisplayText}</span>
            <KeyboardArrowDown sx={{ color: "#263238", fontSize: 24 }} />
          </button>
          {isInviteDropdownOpen && (
            <div className={styles.internalRosterDropdown}>
              <button
                className={styles.internalRosterDropdownOption}
                type="button"
                onClick={() => handleInviteRosterSelect("")}
              >
                <span>&nbsp;</span>
              </button>
              {inviteRosterGroups.length ? (
                inviteRosterGroups.map((roster) => (
                  <button
                    className={styles.internalRosterDropdownOption}
                    key={roster.id}
                    type="button"
                    onClick={() => handleInviteRosterSelect(roster.id)}
                  >
                    <span>{roster.rosterName}</span>
                  </button>
                ))
              ) : (
                <span className={styles.internalRosterDropdownEmpty}>
                  No roster groups available
                </span>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  return null;
};
