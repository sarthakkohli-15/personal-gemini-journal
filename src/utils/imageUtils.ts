import type { AttachedImage } from "../types";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageProcessingResult {
  image?: AttachedImage;
  error?: string;
}

/**
 * Resizes and compresses an image file using an offscreen canvas.
 * This keeps the resulting base64 data URL compact (~80-250KB) to ensure
 * fast Firestore transactions and prevent exceeding document limits.
 */
export async function processAndCompressImage(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.8
): Promise<ImageProcessingResult> {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      error: `Unsupported format "${file.type || 'unknown'}". Please upload JPEG, PNG, WebP, or GIF.`,
    };
  }

  // Validate file size (before compression)
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      error: `Image size (${sizeMb} MB) exceeds the 5 MB limit. Please choose a smaller photo.`,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => {
      resolve({ error: "Failed to read the selected image file." });
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        resolve({ error: "Corrupted or unreadable image file." });
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down proportionally if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback: return original read result
            const rawDataUrl = reader.result as string;
            resolve({
              image: {
                id: "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                name: file.name.slice(0, 80),
                mimeType: file.type,
                size: file.size,
                dataUrl: rawDataUrl,
                uploadedAt: new Date().toISOString(),
              },
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // For animated GIF, keep original if small enough
          const outputType = file.type === "image/gif" && file.size < 800 * 1024 
            ? "image/gif" 
            : "image/jpeg";

          const compressedDataUrl = canvas.toDataURL(outputType, quality);

          // Approximate size of base64
          const approxSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);

          resolve({
            image: {
              id: "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              name: file.name.slice(0, 80),
              mimeType: outputType,
              size: approxSizeBytes,
              dataUrl: compressedDataUrl,
              uploadedAt: new Date().toISOString(),
            },
          });
        } catch (err: any) {
          resolve({ error: "Error processing image: " + (err.message || "Unknown error") });
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
