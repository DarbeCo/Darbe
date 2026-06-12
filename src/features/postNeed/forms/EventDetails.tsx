import { useEffect, useMemo, useRef, useState } from "react";
import {
  AddCircleOutline,
  InfoOutlined,
  KeyboardArrowDown,
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
import { useAppSelector } from "../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../../users/selectors";
import { ConfirmDialog } from "../../../components/confirmDialog/ConfirmDialog";

import styles from "../styles/postNeed.module.css";

export const EventDetails = ({
  data,
  eventType,
  onChange,
  eventOwnerId,
}: EventFormCommonProps) => {
  const [imagePreview, setImagePreview] = useState<File | null>();
  const internalPhotoInputRef = useRef<HTMLInputElement>(null);
  const adultWaiverInputRef = useRef<HTMLInputElement>(null);
  const minorWaiverInputRef = useRef<HTMLInputElement>(null);
  const [isInviteDropdownOpen, setIsInviteDropdownOpen] = useState(false);
  const [isCoordinatorDropdownOpen, setIsCoordinatorDropdownOpen] =
    useState(false);
  const [waiverToRemove, setWaiverToRemove] = useState<
    "adultWaiver" | "minorWaiver" | null
  >(null);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const ownerId = eventOwnerId ?? currentUserId;
  const { data: rosterMembers, isLoading } = useGetRosterAdminsQuery(ownerId);
  const { data: rosters } = useGetRostersQuery(ownerId);
  const { user } = useAppSelector(selectUser);
  const isEntityUser =
    user?.userType === "organization" || user?.userType === "nonprofit";
  const entityCoordinator = isEntityUser && currentUserId === ownerId
    ? {
        id: currentUserId,
        fullName: user?.fullName,
        organizationName: user?.organizationName,
        nonprofitName: user?.nonprofitName,
        profilePicture: user?.profilePicture,
      }
    : undefined;
  const coordinatorOptions = [
    ...(entityCoordinator ? [entityCoordinator] : []),
    ...(rosterMembers ?? []).filter((member) => member.id !== currentUserId),
  ];

  const inviteRosterGroups = useMemo(
    () =>
      [...(rosters ?? [])].sort((firstRoster, secondRoster) =>
        firstRoster.rosterName.localeCompare(secondRoster.rosterName),
      ),
    [rosters],
  );

  const selectedRoster = inviteRosterGroups.find(
    (roster) => roster.id === data.rosterId,
  );

  const selectedRosterDisplayText =
    selectedRoster?.rosterName || "Select roster group";

  useEffect(() => {
    if (!data.eventCoordinator && entityCoordinator?.id) {
      onChange?.((prevState) => ({
        ...prevState,
        eventCoordinator: entityCoordinator.id,
      }));
      return;
    }

    if (!data.eventCoordinator && rosterMembers?.[0]?.id) {
      onChange?.((prevState) => ({
        ...prevState,
        eventCoordinator: rosterMembers[0].id,
      }));
    }
  }, [data.eventCoordinator, entityCoordinator?.id, onChange, rosterMembers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const { name, value } = e.target;
      onChange((prevState) => ({
        ...prevState,
        volunteerImpact: {
          ...prevState.volunteerImpact,
          [name]: value,
          groupImpact: "",
          groupImpactPerHour: "",
          isIndividualImpact: true,
          isGroupImpact: false,
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
    onChange?.((prevState) => ({
      ...prevState,
      rosterId,
    }));
    setIsInviteDropdownOpen(false);
  };

  const handleCoordinatorSelect = (coordinatorId: string) => {
    onChange?.((prevState) => ({
      ...prevState,
      eventCoordinator: coordinatorId,
    }));
    setIsCoordinatorDropdownOpen(false);
  };

  const handlePhotoVisibilityChange = (
    visibility: "public" | "private"
  ) => {
    onChange?.((prevState) => ({
      ...prevState,
      eventPhotoVisibility: visibility,
    }));
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

  const handleRemoveWaiver = () => {
    if (!waiverToRemove) return;

    onChange?.((prevState) => ({
      ...prevState,
      [waiverToRemove]: "",
    }));
    setWaiverToRemove(null);
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
    coordinatorOptions.find((member) => member.id === data.eventCoordinator) ||
    coordinatorOptions[0];
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

  const renderInternalImpactInputs = () => {
    const impactText =
      data.volunteerImpact.individualImpact ||
      data.volunteerImpact.groupImpact ||
      "";
    const hasValues = Boolean(impactText);
    const inputGroupClass = [
      styles.internalImpactInputs,
      hasValues ? styles.internalImpactValidInputs : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={inputGroupClass}>
        <div className={styles.internalImpactTextInput}>
          <Inputs
            label=""
            name="individualImpact"
            darbeInputType="standardInput"
            placeholder="Office Work"
            value={impactText}
            handleChange={handleChange}
          />
          <span>{impactText.length}/150</span>
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
                {coordinatorOptions.length ? (
                  coordinatorOptions.map((member) => (
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
                    No coordinators available
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
                  onClick={() => setWaiverToRemove("adultWaiver")}
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
            {renderInternalImpactInputs()}
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
        {waiverToRemove && (
          <ConfirmDialog
            title={`Remove the ${
              waiverToRemove === "adultWaiver" ? "adult waiver" : "minor waiver"
            }?`}
            confirmLabel="Remove"
            onConfirm={handleRemoveWaiver}
            onCancel={() => setWaiverToRemove(null)}
          />
        )}
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
                {coordinatorOptions.length ? (
                  coordinatorOptions.map((member) => (
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
                    No coordinators available
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
                      onClick={() => setWaiverToRemove("adultWaiver")}
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
                      onClick={() => setWaiverToRemove("minorWaiver")}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.internalPhotoVisibilitySection}>
            <span className={styles.internalOtherLabel}>Photo Visibility</span>
            <div className={styles.internalPhotoVisibilityOptions}>
              <label>
                <input
                  type="radio"
                  name="eventPhotoVisibility"
                  value="public"
                  checked={(data.eventPhotoVisibility ?? "public") === "public"}
                  onChange={() => handlePhotoVisibilityChange("public")}
                />
                <span>Public</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="eventPhotoVisibility"
                  value="private"
                  checked={data.eventPhotoVisibility === "private"}
                  onChange={() => handlePhotoVisibilityChange("private")}
                />
                <span>Private</span>
              </label>
            </div>
            <p className={styles.internalPhotoVisibilityHint}>
              Private photos can only be viewed by members.
            </p>
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
            {renderInternalImpactInputs()}
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
        {waiverToRemove && (
          <ConfirmDialog
            title={`Remove the ${
              waiverToRemove === "adultWaiver" ? "adult waiver" : "minor waiver"
            }?`}
            confirmLabel="Remove"
            onConfirm={handleRemoveWaiver}
            onCancel={() => setWaiverToRemove(null)}
          />
        )}
      </div>
    );
  }

  return null;
};
