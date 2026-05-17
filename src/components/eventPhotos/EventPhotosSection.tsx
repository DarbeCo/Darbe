import { useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";

import {
  useCanUploadEventPhotosQuery,
  useGetEventPhotosQuery,
  useUploadEventPhotoMutation,
} from "../../services/api/endpoints/eventPhotos/eventPhotos.api";
import { useAppDispatch } from "../../services/hooks";
import {
  setExternalData,
  setModalType,
  showModal,
} from "../modal/modalSlice";
import { EDIT_SECTIONS } from "../../features/users/userProfiles/constants";
import {
  ALLOWED_EVENT_PHOTO_MIME_TYPES,
  MAX_EVENT_PHOTO_BYTES,
} from "../../services/darbeService/eventPhotos";

import styles from "./styles/eventPhotos.module.css";

interface EventPhotosSectionProps {
  eventId: string;
}

const MAX_VISIBLE_THUMBS = 6;

export const EventPhotosSection = ({ eventId }: EventPhotosSectionProps) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: photos, isLoading } = useGetEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const { data: canUpload } = useCanUploadEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const [uploadPhoto, { isLoading: isUploading }] =
    useUploadEventPhotoMutation();

  const visiblePhotos = (photos ?? []).slice(0, MAX_VISIBLE_THUMBS);
  const extraPhotoCount = Math.max(
    (photos?.length ?? 0) - MAX_VISIBLE_THUMBS,
    0
  );

  const openCarousel = () => {
    dispatch(setExternalData({ eventId, entityId: "" }));
    dispatch(setModalType(EDIT_SECTIONS.eventPhotoCarousel));
    dispatch(showModal());
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    try {
      await uploadPhoto({ eventId, file }).unwrap();
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Upload failed";
      setUploadError(message);
    }
  };

  return (
    <section className={styles.eventPhotosSection}>
      <div className={styles.eventPhotosSectionHeader}>
        <h2>Event Photos</h2>
        {canUpload && (
          <>
            <button
              type="button"
              className={styles.eventPhotosSectionUpload}
              onClick={handlePickFile}
              disabled={isUploading}
            >
              <CloudUpload fontSize="small" />
              <span>{isUploading ? "Uploading…" : "Add Photo"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EVENT_PHOTO_MIME_TYPES.join(",")}
              onChange={handleFileChange}
              hidden
            />
          </>
        )}
      </div>

      {uploadError && (
        <div className={styles.eventPhotosSectionError}>{uploadError}</div>
      )}

      {isLoading && <CircularProgress size={20} />}

      {!isLoading && !photos?.length && (
        <p className={styles.eventPhotosSectionEmpty}>
          {canUpload
            ? `No photos yet — add the first one (max ${
                MAX_EVENT_PHOTO_BYTES / (1024 * 1024)
              } MB).`
            : "No photos yet"}
        </p>
      )}

      {!isLoading && visiblePhotos.length > 0 && (
        <div className={styles.eventPhotosSectionStrip}>
          {visiblePhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className={styles.eventPhotosSectionThumb}
              onClick={openCarousel}
              aria-label="View event photos"
            >
              <img src={photo.url} alt="" />
            </button>
          ))}
          {extraPhotoCount > 0 && (
            <button
              type="button"
              className={styles.eventPhotosSectionThumb}
              onClick={openCarousel}
              aria-label={`View all ${photos?.length ?? 0} photos`}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  background: "#2c77e7",
                  color: "#ffffff",
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                +{extraPhotoCount}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
