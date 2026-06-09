// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadImage } from "@/lib/cloudinary";
import { uploadSchema } from "@/lib/schemas/upload-schema";

/**
 * POST: Upload an image to Cloudinary
 * Requires authentication. Keeps Cloudinary credentials server-side only.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const { image, folder } = parsed.data;

    const result = await uploadImage(image, folder);

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
