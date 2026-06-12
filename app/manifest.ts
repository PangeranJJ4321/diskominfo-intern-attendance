import type { MetadataRoute } from "next";

/**
 * Generates the web app manifest for the DISKOMINFO-INTERN Progressive Web App.
 * Enables users to install the attendance system on their device home screen.
 *
 * @returns {MetadataRoute.Manifest} The PWA manifest configuration.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DISKOMINFO Intern Attendance",
    short_name: "DISKOMINFO",
    description:
      "DISKOMINFO Intern Attendance System — Validasi wajah, lokasi GPS, dan manajemen shift.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/diskominfo-1.jpeg",
        sizes: "1280x720",
        type: "image/jpeg",
        form_factor: "wide",
      },
      {
        src: "/diskominfo-2.jpeg",
        sizes: "1280x720",
        type: "image/jpeg",
        form_factor: "wide",
      },
    ],
  };
}
