import { useEffect, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  CloudUpload,
} from "@mui/icons-material";

import {
  useCanUploadEventPhotosQuery,
  useGetEventPhotosQuery,
  useUploadEventPhotoMutation,
} from "../../services/api/endpoints/eventPhotos/eventPhotos.api";
import { useAppDispatch } from "../../services/hooks";
import {
  setExternalData,
  setModalType,
} from "../modal/modalSlice";
import { EDIT_SECTIONS } from "../../features/users/userProfiles/constants";
import {
  ALLOWED_EVENT_PHOTO_MIME_TYPES,
  MAX_EVENT_PHOTO_BYTES,
} from "../../services/darbeService/eventPhotos";

import styles from "./styles/eventPhotos.module.css";

interface EventPhotoCarouselModalProps {
  externalData?: unknown;
}

interface CarouselContext {
  eventId: string;
  entityId: string;
}

const parseContext = (externalData: unknown): CarouselContext => {
  if (
    externalData &&
    typeof externalData === "object" &&
    "eventId" in externalData &&
    typeof (externalData as Record<string, unknown>).eventId === "string"
  ) {
    const record = externalData as Record<string, unknown>;
    return {
      eventId: record.eventId as string,
      entityId:
        typeof record.entityId === "string" ? (record.entityId as string) : "",
    };
  }
  return { eventId: "", entityId: "" };
};

export const EventPhotoCarouselModal = ({
  externalData,
}: EventPhotoCarouselModalProps) => {
  const dispatch = useAppDispatch();
  const { eventId, entityId } = parseContext(externalData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: photos, isLoading } = useGetEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const { data: canUpload } = useCanUploadEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const [uploadPhoto, { isLoading: isUploading }] =
    useUploadEventPhotoMutation();

  useEffect(() => {
    if (!photos?.length) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((current) => Math.min(current, photos.length - 1));
  }, [photos?.length]);

  const handleBackToList = () => {
    dispatch(setExternalData(entityId));
    dispatch(setModalType(EDIT_SECTIONS.eventPhotoList));
  };

  const handlePrev = () => {
    if (!photos?.length) return;
    setCurrentIndex((current) =>
      current === 0 ? photos.length - 1 : current - 1
    );
  };

  const handleNext = () => {
    if (!photos?.length) return;
    setCurrentIndex((current) =>
      current === photos.length - 1 ? 0 : current + 1
    );
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
      await uploadPhoto({ eventId, file, entityId }).unwrap();
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Upload failed";
      setUploadError(message);
    }
  };

  if (!eventId) {
    return (
      <div className={styles.eventPhotoCarouselEmpty}>No event selected</div>
    );
  }

  const currentPhoto = photos?.[currentIndex];

  return (
    <div className={styles.eventPhotoCarousel}>
      <div className={styles.eventPhotoCarouselHeader}>
        {entityId ? (
          <button
            type="button"
            className={styles.eventPhotoCarouselBackButton}
            onClick={handleBackToList}
          >
            ← Back to events
          </button>
        ) : (
          <span />
        )}
        {canUpload && (
          <>
            <button
              type="button"
              className={styles.eventPhotoCarouselUploadButton}
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
        <div className={styles.eventPhotoCarouselError}>{uploadError}</div>
      )}

      {isLoading && (
        <div className={styles.eventPhotoCarouselLoading}>
          <CircularProgress />
        </div>
      )}

      {!isLoading && !photos?.length && (
        <p className={styles.eventPhotoCarouselEmpty}>
          {canUpload
            ? `No photos yet — add the first one (max ${
                MAX_EVENT_PHOTO_BYTES / (1024 * 1024)
              } MB).`
            : "No photos yet"}
        </p>
      )}

      {!isLoading && currentPhoto && (
        <div className={styles.eventPhotoCarouselStage}>
          <button
            type="button"
            className={`${styles.eventPhotoCarouselNav} ${styles.eventPhotoCarouselNavPrev}`}
            onClick={handlePrev}
            aria-label="Previous photo"
            disabled={(photos?.length ?? 0) <= 1}
          >
            <ArrowBackIos fontSize="small" />
          </button>

          <img
            className={styles.eventPhotoCarouselImage}
            src={currentPhoto.url}
            alt=""
          />

          <button
            type="button"
            className={`${styles.eventPhotoCarouselNav} ${styles.eventPhotoCarouselNavNext}`}
            onClick={handleNext}
            aria-label="Next photo"
            disabled={(photos?.length ?? 0) <= 1}
          >
            <ArrowForwardIos fontSize="small" />
          </button>

          {currentPhoto.uploader && (
            <div className={styles.eventPhotoCarouselCredit}>
              Photo uploaded by{" "}
              {currentPhoto.uploader.fullName ||
                currentPhoto.uploader.organizationName ||
                currentPhoto.uploader.nonprofitName ||
                "a member"}
            </div>
          )}
        </div>
      )}

      {!isLoading && (photos?.length ?? 0) > 0 && (
        <div className={styles.eventPhotoCarouselCounter}>
          {currentIndex + 1} / {photos?.length}
        </div>
      )}
    </div>
  );
};
