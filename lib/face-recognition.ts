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
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
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
      new faceApi.SsdMobilenetv1Options({ minConfidence: 0.5 }),
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
};

export default faceRecognition;
