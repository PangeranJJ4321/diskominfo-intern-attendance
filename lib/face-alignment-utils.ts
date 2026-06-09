import type {
  FacePoint,
  AlignmentStep,
  AlignmentStepKey,
} from "@/interfaces/profile";
import type { FaceObservation } from "./face-recognition";

export const alignmentSteps: AlignmentStep[] = [
  {
    key: "smile",
    title: "Senyum",
    instruction: "Tersenyumlah lebar ke kamera.",
    completion: "Pose senyum berhasil diambil.",
  },
  {
    key: "left",
    title: "Kiri",
    instruction: "Putar kepala Anda sedikit ke kiri.",
    completion: "Pose kiri berhasil diambil.",
  },
  {
    key: "right",
    title: "Kanan",
    instruction: "Putar kepala Anda sedikit ke kanan.",
    completion: "Pose kanan berhasil diambil.",
  },
  {
    key: "up",
    title: "Atas",
    instruction: "Angkat dagu Anda sedikit ke atas.",
    completion: "Pose atas berhasil diambil.",
  },
  {
    key: "down",
    title: "Bawah",
    instruction: "Tundukkan dagu Anda sedikit ke bawah.",
    completion: "Pose bawah berhasil diambil.",
  },
  {
    key: "center",
    title: "Tengah",
    instruction: "Tatap lurus ke kamera.",
    completion: "Pose tengah berhasil diambil.",
  },
];

/**
 * Calculates the Euclidean distance between two face points.
 *
 * @param {FacePoint} a - The first point.
 * @param {FacePoint} b - The second point.
 * @returns {number} The Euclidean distance between the two points.
 */
function distanceBetween(a: FacePoint, b: FacePoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the center coordinates of a list of face points.
 *
 * @param {FacePoint[]} points - The face points to calculate the center of.
 * @returns {FacePoint} The center point.
 */
export function getPointCenter(points: FacePoint[]): FacePoint {
  const totalPoints = points.length;

  if (totalPoints === 0) {
    return { x: 0, y: 0 };
  }

  return points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x / totalPoints,
      y: accumulator.y + point.y / totalPoints,
    }),
    { x: 0, y: 0 },
  );
}

/**
 * Estimates whether the user is smiling by calculating the mouth aspect ratio
 * (width / height) from the mouth landmark points.
 *
 * The face-api.js 68-point model provides 20 mouth points. Indices used:
 * - 0: left mouth corner
 * - 6: right mouth corner
 * - 3: upper lip center (top)
 * - 9: lower lip center (bottom)
 *
 * A higher ratio indicates a wider, flatter mouth shape (smiling).
 *
 * @param {FacePoint[]} mouthPoints - The 20 mouth landmark points.
 * @returns {number} The mouth aspect ratio (width / height).
 */
function getMouthAspectRatio(mouthPoints: FacePoint[]): number {
  if (mouthPoints.length < 10) {
    return 0;
  }

  const leftCorner = mouthPoints[0];
  const rightCorner = mouthPoints[6];
  const upperLip = mouthPoints[3];
  const lowerLip = mouthPoints[9];

  const mouthWidth = distanceBetween(leftCorner, rightCorner);
  const mouthHeight = distanceBetween(upperLip, lowerLip);

  if (mouthHeight === 0) {
    return 0;
  }

  return mouthWidth / mouthHeight;
}

/**
 * Validates alignment of the face according to the requested step key.
 *
 * @param {FaceObservation} observation - The detected face observation object.
 * @param {AlignmentStepKey} stepKey - The target key for alignment (e.g. smile, left, right, up, down, center).
 * @returns {{ isAligned: boolean; message: string }} An object containing alignment state and instructions.
 */
export function getFaceObservationFeedback(
  observation: FaceObservation,
  stepKey: AlignmentStepKey,
): { isAligned: boolean; message: string } {
  const leftEyeCenter = getPointCenter(observation.landmarks.leftEye);
  const rightEyeCenter = getPointCenter(observation.landmarks.rightEye);
  const noseCenter = getPointCenter(observation.landmarks.nose);
  const faceCenterX = observation.box.x + observation.box.width / 2;
  const faceCenterY = observation.box.y + observation.box.height / 2;
  const normalizedXOffset =
    (noseCenter.x - faceCenterX) / Math.max(observation.box.width, 1);
  const normalizedYOffset =
    (noseCenter.y - faceCenterY) / Math.max(observation.box.height, 1);
  const eyeTilt =
    Math.abs(leftEyeCenter.y - rightEyeCenter.y) /
    Math.max(Math.abs(leftEyeCenter.x - rightEyeCenter.x), 1);

  if (stepKey === "smile") {
    const mouthRatio = getMouthAspectRatio(observation.landmarks.mouth);
    const isAligned = mouthRatio >= 3.7;

    return {
      isAligned,
      message: isAligned
        ? "Senyuman terlihat bagus. Mengambil foto..."
        : "Tersenyumlah lebih lebar ke arah kamera.",
    };
  }

  if (stepKey === "left") {
    const isAligned =
      normalizedXOffset >= 0.1 && Math.abs(normalizedYOffset) <= 0.12;

    return {
      isAligned,
      message: isAligned
        ? "Kesejajaran kiri terlihat bagus. Mengambil foto..."
        : "Putar kepala Anda sedikit lagi ke kiri.",
    };
  }

  if (stepKey === "right") {
    const isAligned =
      normalizedXOffset <= -0.1 && Math.abs(normalizedYOffset) <= 0.12;

    return {
      isAligned,
      message: isAligned
        ? "Kesejajaran kanan terlihat bagus. Mengambil foto..."
        : "Putar kepala Anda sedikit lagi ke kanan.",
    };
  }

  if (stepKey === "up") {
    const isAligned = normalizedYOffset <= -0.04;

    return {
      isAligned,
      message: isAligned
        ? "Kesejajaran atas terlihat bagus. Mengambil foto..."
        : "Angkat dagu Anda sedikit ke atas.",
    };
  }

  if (stepKey === "down") {
    const isAligned = normalizedYOffset >= 0.04;

    return {
      isAligned,
      message: isAligned
        ? "Kesejajaran bawah terlihat bagus. Mengambil foto..."
        : "Tundukkan dagu Anda sedikit ke bawah.",
    };
  }

  // center
  const isAligned =
    Math.abs(normalizedXOffset) <= 0.08 &&
    Math.abs(normalizedYOffset) <= 0.1 &&
    eyeTilt <= 0.08;

  return {
    isAligned,
    message: isAligned
      ? "Tengah sejajar. Mengambil foto..."
      : "Jaga agar wajah Anda tetap di tengah, rata, dan lurus ke arah kamera.",
  };
}
