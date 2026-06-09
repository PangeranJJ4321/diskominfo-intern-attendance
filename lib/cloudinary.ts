// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

// Auto-configured from CLOUDINARY_URL environment variable
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
cloudinary.config({
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a base64 image to Cloudinary.
 * @param base64 - A base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @param folder - The Cloudinary folder to organize uploads (e.g., "profile-pictures")
 * @returns The secure URL and public ID of the uploaded image
 */
export async function uploadImage(
  base64: string,
  folder: string,
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 800, height: 800, crop: "limit" }, // Cap max dimensions
      { quality: "auto", fetch_format: "auto" }, // Optimize delivery
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
