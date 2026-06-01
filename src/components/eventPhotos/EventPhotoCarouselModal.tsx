import { useEffect, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import {
  DeleteOutline,
  ArrowBackIos,
  ArrowForwardIos,
  CloudUpload,
} from "@mui/icons-material";

import {
  useCanDeleteEventPhotosQuery,
  useCanUploadEventPhotosQuery,
  useDeleteEventPhotoMutation,
  useGetEventPhotosQuery,
  useUploadEventPhotoMutation,
} from "../../services/api/endpoints/eventPhotos/eventPhotos.api";
import { selectCurrentUserId } from "../../features/users/selectors";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import {
  setExternalData,
  setModalType,
} from "../modal/modalSlice";
import { EDIT_SECTIONS } from "../../features/users/userProfiles/constants";
import {
  ALLOWED_EVENT_PHOTO_MIME_TYPES,
  MAX_EVENT_PHOTO_BYTES,
  MAX_EVENT_PHOTOS_PER_USER_PER_EVENT,
} from "../../services/darbeService/eventPhotos";

import styles from "./styles/eventPhotos.module.css";

interface EventPhotoCarouselModalProps {
  externalData?: unknown;
}

type ListScope = "entity" | "individual";

interface CarouselContext {
  eventId: string;
  entityId: string;
  listUserId: string;
  listScope: ListScope;
}

const parseContext = (externalData: unknown): CarouselContext => {
  if (
    externalData &&
    typeof externalData === "object" &&
    "eventId" in externalData &&
    typeof (externalData as Record<string, unknown>).eventId === "string"
  ) {
    const record = externalData as Record<string, unknown>;
    const legacyEntityId =
      typeof record.entityId === "string" ? (record.entityId as string) : "";
    const listUserId =
      typeof record.listUserId === "string"
        ? (record.listUserId as string)
        : legacyEntityId;
    const listScope: ListScope =
      record.listScope === "individual" ? "individual" : "entity";

    return {
      eventId: record.eventId as string,
      entityId: legacyEntityId,
      listUserId,
      listScope,
    };
  }
  return {
    eventId: "",
    entityId: "",
    listUserId: "",
    listScope: "entity",
  };
};

export const EventPhotoCarouselModal = ({
  externalData,
}: EventPhotoCarouselModalProps) => {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { eventId, entityId, listUserId, listScope } =
    parseContext(externalData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: photos, isLoading } = useGetEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const { data: canUpload } = useCanUploadEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const { data: canDelete } = useCanDeleteEventPhotosQuery(eventId, {
    skip: !eventId,
  });
  const [uploadPhoto, { isLoading: isUploading }] =
    useUploadEventPhotoMutation();
  const [deletePhoto, { isLoading: isDeleting }] =
    useDeleteEventPhotoMutation();
  const currentPhoto = photos?.[currentIndex];
  const canDeleteCurrentPhoto =
    Boolean(canDelete) ||
    Boolean(currentPhoto?.uploadedBy && currentPhoto.uploadedBy === currentUserId);
  const currentUserPhotoCount =
    photos?.filter((photo) => photo.uploadedBy === currentUserId).length ?? 0;
  const canUploadCurrentUserPhoto =
    Boolean(canUpload) &&
    currentUserPhotoCount < MAX_EVENT_PHOTOS_PER_USER_PER_EVENT;
  const photoLimitMessage = `You can upload up to ${MAX_EVENT_PHOTOS_PER_USER_PER_EVENT} photos per event.`;

  useEffect(() => {
    if (!photos?.length) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((current) => Math.min(current, photos.length - 1));
  }, [photos?.length]);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  }, [currentPhoto?.id]);

  const handleBackToList = () => {
    dispatch(setExternalData({ userId: listUserId, scope: listScope }));
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
    if (!canUploadCurrentUserPhoto) {
      setUploadError(photoLimitMessage);
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadError(null);

    if (!canUploadCurrentUserPhoto) {
      setUploadError(photoLimitMessage);
      return;
    }

    try {
      await uploadPhoto({
        eventId,
        file,
        entityId:
          listScope === "entity" && listUserId ? listUserId : entityId,
        individualId:
          listScope === "individual" && listUserId ? listUserId : undefined,
      }).unwrap();
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Upload failed";
      setUploadError(message);
    }
  };

  const handleDeletePhoto = async () => {
    if (!currentPhoto) return;

    setDeleteError(null);
    try {
      await deletePhoto({
        photoId: currentPhoto.id,
        eventId,
        entityId:
          listScope === "entity" && listUserId ? listUserId : entityId,
        individualId:
          listScope === "individual" && listUserId ? listUserId : undefined,
      }).unwrap();
      setShowDeleteConfirm(false);
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Delete failed";
      setDeleteError(message);
    }
  };

  if (!eventId) {
    return (
      <div className={styles.eventPhotoCarouselEmpty}>No event selected</div>
    );
  }

  return (
    <div className={styles.eventPhotoCarousel}>
      <div className={styles.eventPhotoCarouselHeader}>
        {listUserId ? (
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
              title={!canUploadCurrentUserPhoto ? photoLimitMessage : undefined}
              disabled={isUploading || !canUploadCurrentUserPhoto}
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
      {canUpload && !canUploadCurrentUserPhoto && !uploadError && (
        <div className={styles.eventPhotoCarouselError}>{photoLimitMessage}</div>
      )}
      {deleteError && (
        <div className={styles.eventPhotoCarouselError}>{deleteError}</div>
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

          {canDeleteCurrentPhoto && (
            <button
              type="button"
              className={styles.eventPhotoCarouselDeleteButton}
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete photo"
              disabled={isDeleting}
            >
              <DeleteOutline fontSize="small" />
              <span>Delete</span>
            </button>
          )}

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

      {showDeleteConfirm && (
        <div className={styles.eventPhotoConfirmOverlay}>
          <div
            className={styles.eventPhotoConfirmDialog}
            role="dialog"
            aria-modal="true"
          >
            <h2>Delete this photo?</h2>
            <div className={styles.eventPhotoConfirmActions}>
              <button
                type="button"
                className={styles.eventPhotoConfirmDelete}
                onClick={handleDeletePhoto}
                disabled={isDeleting}
              >
                Delete
              </button>
              <button
                type="button"
                className={styles.eventPhotoConfirmCancel}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
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
