type FaceApiModule = typeof import("face-api.js");
type FaceApiInput = Parameters<FaceApiModule["detectAllFaces"]>[0];

type FacePoint = {
  x: number;
  y: number;
};

export type FaceObservation = {
  descriptor: number[];
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: {
    leftEye: FacePoint[];
    rightEye: FacePoint[];
    nose: FacePoint[];
    mouth: FacePoint[];
  };
};

// Use the raw GitHub URL to fetch the models directly from the specified commit
const DEFAULT_MODEL_PATH =
  "https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/597990afa81e877a24da23aa93ab3f1375098f53/models";

const modelLoadPromises = new Map<string, Promise<void>>();

async function loadFaceApi(): Promise<FaceApiModule> {
  return import("face-api.js");
}

function resolveModelPath(modelPath: string): string {
  // If the path is already an external URL, return it directly to avoid appending localhost
  if (modelPath.startsWith("http://") || modelPath.startsWith("https://")) {
    return modelPath;
  }
  return new URL(modelPath, window.location.origin).toString();
}

async function loadModels(modelPath = DEFAULT_MODEL_PATH): Promise<void> {
  const existingPromise = modelLoadPromises.get(modelPath);

  if (existingPromise) {
    await existingPromise;
    return;
  }

  const loadPromise = (async () => {
    try {
      const faceApi = await loadFaceApi();
      const resolvedModelPath = resolveModelPath(modelPath);

      await Promise.all([
        faceApi.nets.ssdMobilenetv1.loadFromUri(resolvedModelPath),
        faceApi.nets.faceLandmark68Net.loadFromUri(resolvedModelPath),
        faceApi.nets.faceRecognitionNet.loadFromUri(resolvedModelPath),
      ]);
    } catch (error) {
      modelLoadPromises.delete(modelPath);
      throw error;
    }
  })();

  modelLoadPromises.set(modelPath, loadPromise);
  await loadPromise;
}

function toFacePoint(point: { x: number; y: number }): FacePoint {
  return {
    x: point.x,
    y: point.y,
  };
}

async function detectFaceObservationFromInput(
  input: FaceApiInput,
  modelPath = DEFAULT_MODEL_PATH,
): Promise<FaceObservation | null> {
  await loadModels(modelPath);

  const faceApi = await loadFaceApi();
  const detections = await faceApi
    .detectAllFaces(
      input,
      new faceApi.SsdMobilenetv1Options({
        minConfidence: 0.5,
      }),
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

async function detectDescriptorFromInput(
  input: FaceApiInput,
  modelPath = DEFAULT_MODEL_PATH,
): Promise<number[] | null> {
  const observation = await detectFaceObservationFromInput(input, modelPath);

  return observation ? observation.descriptor : null;
}

const faceRecognition = {
  loadModels,
  detectFaceObservationFromInput,
  detectDescriptorFromInput,
  DEFAULT_MODEL_PATH,
};

export default faceRecognition;
