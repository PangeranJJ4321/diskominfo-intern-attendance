"use client";

import { handleError } from "./utils";

export async function uploadImage(
  image: File,
  folder: string
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    await handleError(res, "Gagal mengunggah foto.");
  }

  return res.json();
}
