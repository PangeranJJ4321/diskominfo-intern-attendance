// lib/file-storage.ts
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface LocalUploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a file buffer to the local public/uploads directory.
 * @param buffer - The file binary data as a Buffer
 * @param folder - The subfolder to organize uploads (e.g., "profile-pictures")
 * @param originalFilename - The original filename to extract extension
 * @returns The local URL path and a unique public ID (filename)
 */
export async function uploadLocalImage(
  buffer: Buffer,
  folder: string,
  originalFilename: string
): Promise<LocalUploadResult> {
  // Determine persistent storage directory.
  // In production cPanel, this prevents uploads from being deleted during deployment.
  const isProduction = process.env.NODE_ENV === "production";
  
  const defaultUploadDir = isProduction
    ? path.join(process.cwd(), "..", "storage_absensi")
    : path.join(process.cwd(), "public", "uploads");

  const storagePath = process.env.UPLOAD_DIR 
    ? process.env.UPLOAD_DIR 
    : defaultUploadDir;

  const baseUploadDir = path.join(storagePath, folder);

  // Ensure directory exists
  await fs.mkdir(baseUploadDir, { recursive: true });

  // Generate unique filename to prevent collisions
  const ext = path.extname(originalFilename) || ".jpg";
  const uniqueId = randomUUID();
  const filename = `${uniqueId}${ext}`;

  // Full file path
  const filePath = path.join(baseUploadDir, filename);

  // Write file to disk
  await fs.writeFile(filePath, buffer);

  // Return the web-accessible URL
  // Uses forward slashes for URLs regardless of OS
  const url = `/uploads/${folder}/${filename}`;

  return {
    url,
    publicId: `${folder}/${uniqueId}`,
  };
}
