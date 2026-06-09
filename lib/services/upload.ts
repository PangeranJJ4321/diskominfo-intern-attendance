"use client";

import { handleError } from "./utils";

export async function uploadImage(
  image: string,
  folder: string
): Promise<{ url: string }> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, folder }),
  });

  if (!res.ok) {
    await handleError(res, "Gagal mengunggah foto.");
  }

  return res.json();
}
