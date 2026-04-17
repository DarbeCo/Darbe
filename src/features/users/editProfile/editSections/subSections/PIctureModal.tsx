import { useRef, useState } from "react";
import {
  AddAPhotoOutlined,
  DeleteOutline,
  TuneOutlined,
} from "@mui/icons-material";

import { ClosingIcon } from "../../../../../components/closingIcon/ClosingIcon";
import { Typography } from "../../../../../components/typography/Typography";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";
import { convertFileToBase64 } from "../../../../../utils/CommonFunctions";
import { assetUrl } from "../../../../../utils/assetUrl";

import styles from "./styles/subSections.module.css";

// TODO: Rename file, lowercase I after P in PictureModal
interface PictureModalProps {
  closeModal: () => void;
  userId: string;
  isCoverPhoto?: boolean;
  currentPicture?: string;
}

export const PictureModal = ({
  closeModal,
  userId,
  isCoverPhoto,
  currentPicture,
}: PictureModalProps) => {
  const pictureType = isCoverPhoto ? "cover" : "profile";
  const storageKey = `picture-modal-original:${pictureType}:${userId}`;
  const positionStorageKey = `picture-modal-position:${pictureType}:${userId}`;
  const getStoredOriginal = () => {
    try {
      return window.localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  };
  const getStoredPosition = () => {
    try {
      const value = window.localStorage.getItem(positionStorageKey);
      if (!value) {
        return { x: 50, y: 50 };
      }
      const parsed = JSON.parse(value) as { x?: number; y?: number };
      return {
        x: typeof parsed.x === "number" ? parsed.x : 50,
        y: typeof parsed.y === "number" ? parsed.y : 50,
      };
    } catch {
      return { x: 50, y: 50 };
    }
  };

  const [updateUserProfile, { isError, isLoading }] =
    useUpdateUserProfileMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adjustFrameRef = useRef<HTMLDivElement>(null);
  const [sourceImageSrc, setSourceImageSrc] = useState<string>(() => {
    const storedOriginal = getStoredOriginal();
    return storedOriginal || (currentPicture ? assetUrl(currentPicture) : "");
  });
  const [displayImageSrc, setDisplayImageSrc] = useState<string>(
    currentPicture ? assetUrl(currentPicture) : ""
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [cropCenter, setCropCenter] = useState(getStoredPosition);
  const [coverPosition, setCoverPosition] = useState(getStoredPosition);
  const pictureTitle = isCoverPhoto ? "Cover Photo" : "Profile Photo";
  const fallbackImage = isCoverPhoto
    ? assetUrl("/images/defaultCoverPhoto.jpg")
    : assetUrl("/images/defaultProfilePicture.jpg");
  const activePreviewSrc = displayImageSrc || fallbackImage;

  const resetAdjustments = () => {
    const centeredPosition = { x: 50, y: 50 };
    setCropCenter(centeredPosition);
    setCoverPosition(centeredPosition);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileUploads = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    void (async () => {
      try {
        const base64File = await convertFileToBase64(file);
        setSourceImageSrc(base64File);
        setDisplayImageSrc(base64File);
        setShowDeleteConfirm(false);
        setIsAdjusting(true);
        setHasPendingChanges(true);
        resetAdjustments();
        try {
          window.localStorage.setItem(storageKey, base64File);
        } catch {
          // Best-effort cache so future adjustments can reopen from the original image.
        }
      } finally {
        event.target.value = "";
      }
    })();
  };

  const clampCropPosition = (x: number, y: number, size: number) => {
    const min = (size / 2) * 100;
    const max = 100 - min;
    return {
      x: Math.min(max, Math.max(min, x)),
      y: Math.min(max, Math.max(min, y)),
    };
  };

  const getCropSizeRatio = () => 0.8125;
  const getProfileFrameSize = () => ({ width: 320, height: 230 });
  const getCoverFrameSize = () => ({ width: 480, height: 160 });

  const createProfileCropPreview = async (
    nextCropCenter: { x: number; y: number },
    sourceOverride?: string
  ) => {
    const imageSource = sourceOverride || sourceImageSrc || currentPicture;
    if (!imageSource) {
      return "";
    }

    const source = sourceOverride || sourceImageSrc || assetUrl(currentPicture ?? "");
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.crossOrigin = "anonymous";
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Unable to load image"));
      nextImage.src = source;
    });

    const canvas = document.createElement("canvas");
    const targetWidth = isCoverPhoto ? 1200 : 640;
    const targetHeight = isCoverPhoto ? 400 : 460;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Unable to create preview canvas");
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    if (isCoverPhoto) {
      const { width: frameWidth, height: frameHeight } = getCoverFrameSize();
      const baseScale = Math.max(
        frameWidth / image.width,
        frameHeight / image.height
      );
      const renderedWidth = image.width * baseScale;
      const renderedHeight = image.height * baseScale;
      const overflowX = Math.max(0, renderedWidth - frameWidth);
      const overflowY = Math.max(0, renderedHeight - frameHeight);
      const drawX = -overflowX * (nextCropCenter.x / 100);
      const drawY = -overflowY * (nextCropCenter.y / 100);
      const targetScale = targetWidth / frameWidth;

      ctx.save();
      ctx.scale(targetScale, targetScale);
      ctx.drawImage(image, drawX, drawY, renderedWidth, renderedHeight);
      ctx.restore();
      return canvas.toDataURL("image/jpeg", 0.92);
    }

    const { width: frameWidth, height: frameHeight } = getProfileFrameSize();
    const baseScale = Math.max(
      frameWidth / image.width,
      frameHeight / image.height
    );
    const renderedWidth = image.width * baseScale;
    const renderedHeight = image.height * baseScale;
    const imageOffsetX = (frameWidth - renderedWidth) / 2;
    const imageOffsetY = (frameHeight - renderedHeight) / 2;
    const cropCenterX = (nextCropCenter.x / 100) * frameWidth;
    const cropCenterY = (nextCropCenter.y / 100) * frameHeight;
    const frameCenterX = frameWidth / 2;
    const frameCenterY = frameHeight / 2;
    const translateX = frameCenterX - cropCenterX;
    const translateY = frameCenterY - cropCenterY;
    const targetScale = targetWidth / frameWidth;

    ctx.save();
    ctx.scale(targetScale, targetScale);
    ctx.drawImage(
      image,
      imageOffsetX + translateX,
      imageOffsetY + translateY,
      renderedWidth,
      renderedHeight
    );
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleSubmitPicture = async () => {
    try {
      const category = isCoverPhoto ? "coverPhoto" : "profilePicture";
      const pictureValue = isCoverPhoto
        ? await createProfileCropPreview(coverPosition)
        : await createProfileCropPreview(cropCenter);
      if (!pictureValue) {
        return;
      }

      const payload = {
        user: {
          id: userId,
          [category]: pictureValue,
        },
      };

      await updateUserProfile(payload).unwrap();
      try {
        if (sourceImageSrc) {
          window.localStorage.setItem(storageKey, sourceImageSrc);
        }
        window.localStorage.setItem(
          positionStorageKey,
          JSON.stringify(isCoverPhoto ? coverPosition : cropCenter)
        );
      } catch {
        // Ignore storage failures and keep the saved profile update.
      }
      closeModal();
    } catch (error) {
      console.error("Error submitting post", error);
    }
  };

  const handleDeletePicture = async () => {
    try {
      const category = isCoverPhoto ? "coverPhoto" : "profilePicture";
      await updateUserProfile({
        user: {
          id: userId,
          [category]: "",
        },
      }).unwrap();
      try {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(positionStorageKey);
      } catch {
        // Ignore storage failures and keep the delete behavior.
      }
      closeModal();
    } catch (error) {
      console.error("Error deleting picture", error);
    }
  };

  const handleStartAdjusting = () => {
    if (!activePreviewSrc) {
      return;
    }

    setShowDeleteConfirm(false);
    setIsAdjusting(true);
  };

  const handleAdjustPointer = (clientX: number, clientY: number) => {
    const frame = adjustFrameRef.current;
    if (!frame) {
      return;
    }

    const rect = frame.getBoundingClientRect();
    const nextX = ((clientX - rect.left) / rect.width) * 100;
    const nextY = ((clientY - rect.top) / rect.height) * 100;
    if (isCoverPhoto) {
      const nextCoverPosition = {
        x: Math.min(100, Math.max(0, nextX)),
        y: Math.min(100, Math.max(0, nextY)),
      };
      setCoverPosition(nextCoverPosition);
      setHasPendingChanges(true);
      return;
    }

    const nextCropCenter = clampCropPosition(nextX, nextY, getCropSizeRatio());
    setCropCenter(nextCropCenter);
    setHasPendingChanges(true);
  };

  const handleAdjustPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    handleAdjustPointer(event.clientX, event.clientY);
  };

  const handleAdjustPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    handleAdjustPointer(event.clientX, event.clientY);
  };

  const handleAdjustPointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const hasCustomPicture = Boolean(sourceImageSrc || currentPicture);

  return (
    <div className={styles.modalContainer}>
      <div className={styles.pictureModalContent}>
        <div className={styles.pictureModalHeader}>
          <ClosingIcon onClick={closeModal} horizontalPlacement="left" useNoSx />
          <span className={styles.pictureModalHeaderText}>{pictureTitle}</span>
          <button
            type="button"
            className={styles.pictureModalHeaderSave}
            onClick={handleSubmitPicture}
            disabled={!hasPendingChanges || showDeleteConfirm || isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
        <div className={styles.pictureModalPreviewSection}>
          {isError && (
            <Typography
              textToDisplay={
                "Error uploading picture! Please try a different one"
              }
              variant="boldTextSmall"
            />
          )}
          <div className={styles.pictureModalPreviewSurface}>
            <div
              ref={adjustFrameRef}
              className={`${styles.pictureModalPreviewFrame} ${
                isAdjusting && !isCoverPhoto
                  ? styles.profilePhotoAdjustFrame
                  : isCoverPhoto && isAdjusting
                    ? styles.coverPhotoAdjustFrame
                    : isCoverPhoto
                    ? styles.coverPhotoFrame
                    : styles.profilePhotoFrame
              }`}
              onPointerDown={isAdjusting ? handleAdjustPointerDown : undefined}
              onPointerMove={isAdjusting ? handleAdjustPointerMove : undefined}
              onPointerUp={isAdjusting ? handleAdjustPointerUp : undefined}
              onPointerCancel={isAdjusting ? handleAdjustPointerUp : undefined}
            >
              <>
                <img
                  src={
                    isAdjusting && sourceImageSrc
                      ? sourceImageSrc
                      : activePreviewSrc
                  }
                  alt={pictureTitle}
                  className={styles.pictureModalPreviewImage}
                  style={
                    isCoverPhoto
                      ? {
                          objectPosition: `${coverPosition.x}% ${coverPosition.y}%`,
                        }
                      : undefined
                  }
                />
                {isAdjusting && !isCoverPhoto && (
                  <div
                    className={styles.pictureModalCropRing}
                    style={{
                      left: `${cropCenter.x}%`,
                      top: `${cropCenter.y}%`,
                    }}
                  />
                )}
              </>
            </div>
            {showDeleteConfirm && (
              <div className={styles.pictureModalConfirmOverlay}>
                <div className={styles.pictureModalConfirmCard}>
                  <span className={styles.pictureModalConfirmText}>
                    Are you sure you want to delete?
                  </span>
                  <div className={styles.pictureModalConfirmActions}>
                    <button
                      type="button"
                      className={styles.pictureModalConfirmButton}
                      onClick={handleDeletePicture}
                      disabled={isLoading}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`${styles.pictureModalConfirmButton} ${styles.pictureModalConfirmCancelButton}`}
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {isAdjusting && (
            <div className={styles.pictureModalAdjustPanel}>
              <span className={styles.pictureModalAdjustHint}>
                {isCoverPhoto
                  ? "Drag across the image to reposition your cover photo."
                  : "Drag the circle over the part of the photo you want to use."}
              </span>
            </div>
          )}
        </div>
        <div className={styles.pictureModalFooter}>
            <button
            type="button"
            className={styles.pictureModalAction}
            onClick={handleStartAdjusting}
            disabled={!hasCustomPicture || isLoading}
          >
            <TuneOutlined fontSize="small" />
            <span>Adjust</span>
          </button>
          <button
            type="button"
            className={styles.pictureModalAction}
            onClick={openFilePicker}
            disabled={isLoading}
          >
            <AddAPhotoOutlined fontSize="small" />
            <span>Add Photo</span>
          </button>
          <button
            type="button"
            className={styles.pictureModalAction}
            onClick={() => {
              if (!hasCustomPicture) {
                return;
              }

              setIsAdjusting(false);
              setShowDeleteConfirm(true);
            }}
            disabled={!hasCustomPicture || isLoading}
          >
            <DeleteOutline fontSize="small" />
            <span>Delete</span>
          </button>
        </div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          ref={fileInputRef}
          className={styles.pictureModalInput}
          onChange={handleFileUploads}
        />
      </div>
    </div>
  );
};
