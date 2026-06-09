import { z } from "zod";

export const uploadSchema = z.object({
  image: z
    .string()
    .min(1, "Image data is required.")
    .refine(
      (val) => val.startsWith("data:image/"),
      "Image must be a valid base64 data URL.",
    ),
  folder: z.string().optional().default("uploads"),
});
