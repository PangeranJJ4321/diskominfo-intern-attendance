"use client";

import { create } from "zustand";

/** State shape for the face capture store */
interface FaceCaptureState {
  /** URL of the uploaded photo */
  photoUrl: string | null;
  /** Face descriptor array captured during verification */
  faceDescriptor: number[] | null;
}

/** Actions exposed by the face capture store */
interface FaceCaptureActions {
  /** Set the capture result (photo URL + face descriptor) */
  setCapture: (photoUrl: string, faceDescriptor: number[]) => void;
  /** Clear the capture state */
  clearCapture: () => void;
}

export const useFaceCaptureStore = create<
  FaceCaptureState & FaceCaptureActions
>((set) => ({
  photoUrl: null,
  faceDescriptor: null,

  setCapture: (photoUrl, faceDescriptor) => set({ photoUrl, faceDescriptor }),

  clearCapture: () => set({ photoUrl: null, faceDescriptor: null }),
}));
