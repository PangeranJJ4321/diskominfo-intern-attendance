type FaceApiModule = typeof import("face-api.js");
type FaceApiInput = Parameters<FaceApiModule["detectAllFaces"]>[0];
type FacePoint = { x: number; y: number };

export type FaceObservation = {
  descriptor: number[];
  box: { x: number; y: number; width: number; height: number };
  landmarks: {
    leftEye: FacePoint[];
    rightEye: FacePoint[];
    nose: FacePoint[];
    mouth: FacePoint[];
  };
};

// EAR Threshold typically ranges from 0.2 to 0.3. 0.25 is a good default.
const EAR_THRESHOLD = 0.25;

/**
 * Calculates the Eye Aspect Ratio (EAR) for a given eye.
 * The EAR is computed as: (||p1-p5|| + ||p2-p4||) / (2 * ||p0-p3||)
 * where points are ordered clockwise starting from the outer corner.
 * 
 * @param eyePoints - Array of 6 FacePoints representing an eye.
 * @returns The computed EAR.
 */
function calculateEAR(eyePoints: FacePoint[]): number {
  if (eyePoints.length !== 6) return 0;

  const dist = (p1: FacePoint, p2: FacePoint) =>
    Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  // Vertical distances
  const v1 = dist(eyePoints[1], eyePoints[5]);
  const v2 = dist(eyePoints[2], eyePoints[4]);
  // Horizontal distance
  const h = dist(eyePoints[0], eyePoints[3]);

  return (v1 + v2) / (2.0 * h);
}

/**
 * Detects if a blink has occurred based on the provided landmarks.
 * 
 * @param landmarks - The facial landmarks containing leftEye and rightEye.
 * @returns {boolean} True if the EAR falls below the threshold (blink detected).
 */
export function detectBlink(landmarks: FaceObservation["landmarks"]): boolean {
  const leftEAR = calculateEAR(landmarks.leftEye);
  const rightEAR = calculateEAR(landmarks.rightEye);
  const averageEAR = (leftEAR + rightEAR) / 2.0;

  return averageEAR < EAR_THRESHOLD;
}

function distanceBetween(a: FacePoint, b: FacePoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMouthAspectRatio(mouthPoints: FacePoint[]): number {
  if (mouthPoints.length < 10) return 0;
  const leftCorner = mouthPoints[0];
  const rightCorner = mouthPoints[6];
  const upperLip = mouthPoints[3];
  const lowerLip = mouthPoints[9];

  const mouthWidth = distanceBetween(leftCorner, rightCorner);
  const mouthHeight = distanceBetween(upperLip, lowerLip);
  if (mouthHeight === 0) return 0;
  return mouthWidth / mouthHeight;
}

export function detectSmile(landmarks: FaceObservation["landmarks"]): boolean {
  return getMouthAspectRatio(landmarks.mouth) >= 3.7;
}

let modelsLoaded = false;

/**
 * Dynamically imports the face-api.js module. Uses a dynamic import so the
 * heavy library is only loaded when face features are needed.
 *
 * @returns {Promise<FaceApiModule>} A promise that resolves to the face-api.js
 * module.
 */
async function loadFaceApi(): Promise<FaceApiModule> {
  return import("face-api.js");
}

/**
 * Loads face-api.js models from the local /models directory.
 * Models are fetched once.
 * @param onProgress Optional callback for loading progress
 */
export async function loadModels(
  onProgress?: (text: string, progress: number) => void
) {
  if (modelsLoaded) return;
  if (typeof window === "undefined") return;

  try {
    onProgress?.("Memuat model Face API dari server...", 10);
    const modelUrl = "/models";
    const faceapi = await loadFaceApi();
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
    ]);

    modelsLoaded = true;
    onProgress?.("Model Face API siap.", 100);
  } catch (error) {
    console.error("Error loading face models:", error);
    onProgress?.("Gagal memuat model Face API.", 0);
    throw new Error("Failed to load face recognition models");
  }
}

/**
 * Converts an {x, y} point from face-api.js into the shared FacePoint type.
 *
 * @param {{ x: number; y: number }} point - A point from a face-api.js
 * landmark.
 * @returns {FacePoint} The converted point.
 */
function toFacePoint(point: { x: number; y: number }): FacePoint {
  return {
    x: point.x,
    y: point.y,
  };
}

/**
 * Detects a single face from an image or video element and returns its
 * descriptor, bounding box, and facial landmarks.
 *
 * @param {FaceApiInput} input - An HTMLImageElement, HTMLVideoElement,
 * HTMLCanvasElement, or ImageData to analyze.
 * @returns {Promise<FaceObservation | null>} A promise that resolves to the
 * face observation, or null when zero or multiple faces are detected.
 */
async function detectFaceObservationFromInput(
  input: FaceApiInput,
): Promise<FaceObservation | null> {
  await loadModels();
  const faceApi = await loadFaceApi();
  const detections = await faceApi
    .detectAllFaces(
      input,
      new faceApi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length !== 1) {
    return null;
  }

  const detection = detections[0];
  return {
    descriptor: Array.from(detection.descriptor),
    box: {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height,
    },
    landmarks: {
      leftEye: detection.landmarks.getLeftEye().map(toFacePoint),
      rightEye: detection.landmarks.getRightEye().map(toFacePoint),
      nose: detection.landmarks.getNose().map(toFacePoint),
      mouth: detection.landmarks.getMouth().map(toFacePoint),
    },
  };
}

/**
 * Detects a single face from an input and returns only its descriptor vector.
 *
 * @param {FaceApiInput} input - An HTMLImageElement, HTMLVideoElement,
 * HTMLCanvasElement, or ImageData to analyze.
 * @returns {Promise<number[] | null>} A promise that resolves to the face
 * descriptor array, or null when no single face was detected.
 */
async function detectDescriptorFromInput(
  input: FaceApiInput,
): Promise<number[] | null> {
  const observation = await detectFaceObservationFromInput(input);
  return observation ? observation.descriptor : null;
}

const faceRecognition = {
  loadModels,
  detectFaceObservationFromInput,
  detectDescriptorFromInput,
  detectBlink,
  detectSmile,
};

export default faceRecognition;
