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

/** Dummy path used for face-api.js loadFromUri — actual files are served from IndexedDB. */
const DEFAULT_MODEL_PATH = "/models";

/**
 * Progress callback type for model loading phases.
 *
 * @param phase - Current phase: "checking", "downloading", "loading", or "done".
 * @param loaded - Number of files downloaded so far (only meaningful during "downloading" phase).
 * @param total - Total number of model files to download.
 */
export type ModelLoadingCallback = (
  phase: "checking" | "downloading" | "loading" | "done",
  loaded?: number,
  total?: number,
) => void;

/** Cloudinary secure URLs for every face-api.js model file. */
const MODEL_URL_MAP: Readonly<Record<string, string>> = {
  "ssd_mobilenetv1_model-shard1":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919754/face-models/face-models/ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919777/face-models/face-models/ssd_mobilenetv1_model-shard2",
  "ssd_mobilenetv1_model-weights_manifest.json":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919778/face-models/face-models/ssd_mobilenetv1_model-weights_manifest.json",
  "face_landmark_68_model-shard1":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919819/face-models/face-models/face_landmark_68_model-shard1",
  "face_landmark_68_model-weights_manifest.json":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919820/face-models/face-models/face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-shard1":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919880/face-models/face-models/face_recognition_model-shard1",
  "face_recognition_model-shard2":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919921/face-models/face-models/face_recognition_model-shard2",
  "face_recognition_model-weights_manifest.json":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919922/face-models/face-models/face_recognition_model-weights_manifest.json",
  "mtcnn_model-shard1":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919810/face-models/face-models/mtcnn_model-shard1",
  "mtcnn_model-weights_manifest.json":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919811/face-models/face-models/mtcnn_model-weights_manifest.json",
  "tiny_face_detector_model-shard1":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919814/face-models/face-models/tiny_face_detector_model-shard1",
  "tiny_face_detector_model-weights_manifest.json":
    "https://res.cloudinary.com/dsxe1kxqy/raw/upload/v1780919814/face-models/face-models/tiny_face_detector_model-weights_manifest.json",
};

/** Required model file names for face-api.js. */
const MODEL_FILES: readonly string[] = Object.keys(MODEL_URL_MAP);

/** Set of model file names for fast lookups in the fetch interceptor. */
const MODEL_FILE_SET: ReadonlySet<string> = new Set(MODEL_FILES);

/** IndexedDB configuration for model caching. */
const CACHE_DB_NAME = "face-models-cache";
const CACHE_DB_VERSION = 1;
const CACHE_STORE_NAME = "models";
const MODEL_LOAD_PROMISES = new Map<string, Promise<void>>();

/**
 * Opens (or creates) the IndexedDB database used to cache face-api.js model
 * files so they persist across browser sessions.
 *
 * @returns {Promise<IDBDatabase>} A promise that resolves to the open database.
 */
function openCacheDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CACHE_STORE_NAME)) {
        request.result.createObjectStore(CACHE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a cached model file as an ArrayBuffer from IndexedDB.
 *
 * @param {string} fileName - The model file name to retrieve.
 * @returns {Promise<ArrayBuffer | null>} A promise that resolves to the cached
 * data, or null if not found.
 */
async function getCachedModelFile(
  fileName: string,
): Promise<ArrayBuffer | null> {
  const db = await openCacheDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHE_STORE_NAME, "readonly");
    const getRequest = transaction.objectStore(CACHE_STORE_NAME).get(fileName);
    getRequest.onsuccess = () =>
      resolve(
        getRequest.result instanceof ArrayBuffer ? getRequest.result : null,
      );
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Stores a model file as an ArrayBuffer in IndexedDB.
 *
 * @param {string} fileName - The model file name to store.
 * @param {ArrayBuffer} data - The file content to cache.
 * @returns {Promise<void>} A promise that resolves when the data is stored.
 */
async function setCachedModelFile(
  fileName: string,
  data: ArrayBuffer,
): Promise<void> {
  const db = await openCacheDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHE_STORE_NAME, "readwrite");
    transaction.objectStore(CACHE_STORE_NAME).put(data, fileName);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Checks if all required model files are present in the IndexedDB cache.
 *
 * @returns {Promise<boolean>} A promise that resolves to true when every
 * required model file exists in the cache.
 */
async function areAllModelsCached(): Promise<boolean> {
  try {
    const results = await Promise.all(
      MODEL_FILES.map((file) => getCachedModelFile(file)),
    );
    return results.every((result) => result !== null);
  } catch {
    return false;
  }
}

/**
 * Downloads all model files from Cloudinary and caches them in IndexedDB
 * for future sessions. Uses the hardcoded MODEL_URL_MAP to fetch each file
 * from its dedicated Cloudinary URL.
 *
 * @returns {Promise<void>} A promise that resolves when all files are cached.
 */
async function downloadAndCacheModels(
  onProgress?: ModelLoadingCallback,
): Promise<void> {
  const total = MODEL_FILES.length;
  let loaded = 0;

  onProgress?.("downloading", loaded, total);

  const results = await Promise.allSettled(
    MODEL_FILES.map(async (fileName) => {
      const url = MODEL_URL_MAP[fileName];
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch model file ${fileName}: ${response.status} ${response.statusText}`,
        );
      }
      const buffer = await response.arrayBuffer();
      await setCachedModelFile(fileName, buffer);
      loaded++;
      onProgress?.("downloading", loaded, total);
    }),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failures.length > 0) {
    throw new Error(
      `Failed to cache ${failures.length} model file(s): ${failures.map((f) => (f.reason as Error).message).join("; ")}`,
    );
  }
}

/**
 * Temporarily overrides window.fetch to serve model requests from the
 * IndexedDB cache. When face-api.js calls loadFromUri, its internal fetch
 * calls for model shards are intercepted and served from the local cache.
 *
 * @returns {() => void} A cleanup function that restores the original fetch.
 */
function overrideFetchForModelCache(): () => void {
  if (typeof window === "undefined" || typeof window.fetch === "undefined") {
    return () => {};
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    // Extract the file name from the URL's last path segment
    const fileName = url.split("/").pop() ?? "";

    if (MODEL_FILE_SET.has(fileName)) {
      const cachedData = await getCachedModelFile(fileName);
      if (cachedData) {
        return new Response(cachedData, {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/octet-stream" },
        });
      }
    }

    return originalFetch(input, init);
  };

  return () => {
    window.fetch = originalFetch;
  };
}

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
 * Resolves the model path to an absolute URL. Paths already starting with
 * http(s) are returned as-is; otherwise the path is resolved against the
 * current origin.
 *
 * @param {string} modelPath - A relative or absolute model base path.
 * @returns {string} The fully resolved URL string.
 */
function resolveModelPath(modelPath: string): string {
  if (modelPath.startsWith("http://") || modelPath.startsWith("https://")) {
    return modelPath;
  }
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  return new URL(modelPath, base).toString();
}

/**
 * Loads face-api.js models from Cloudinary. Models are fetched once and
 * cached in IndexedDB so subsequent page loads avoid network requests
 * entirely, making face recognition faster across sessions.
 *
 * The actual model path passed to face-api.js's loadFromUri is a dummy
 * local path — the fetch interceptor serves the real files from IndexedDB.
 *
 * @param {string} [modelPath=DEFAULT_MODEL_PATH] - The dummy base path for
 * face-api.js internal fetching (unused for actual downloads).
 * @param {ModelLoadingCallback} [onProgress] - Optional callback to report
 * loading progress phases and download count.
 * @returns {Promise<void>} A promise that resolves when all models are loaded.
 */
async function loadModels(
  modelPath = DEFAULT_MODEL_PATH,
  onProgress?: ModelLoadingCallback,
): Promise<void> {
  const existingPromise = MODEL_LOAD_PROMISES.get(modelPath);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const loadPromise = (async () => {
    try {
      // Check if models are already cached in IndexedDB
      onProgress?.("checking");

      const modelsCached = await areAllModelsCached();

      if (!modelsCached) {
        // Download models from Cloudinary and cache them in IndexedDB
        await downloadAndCacheModels(onProgress);
      }

      // Override fetch so face-api.js loads from IndexedDB
      const restoreFetch = overrideFetchForModelCache();

      try {
        onProgress?.("loading");

        const faceApi = await loadFaceApi();
        const resolvedModelPath = resolveModelPath(modelPath);
        await Promise.all([
          faceApi.nets.ssdMobilenetv1.loadFromUri(resolvedModelPath),
          faceApi.nets.faceLandmark68Net.loadFromUri(resolvedModelPath),
          faceApi.nets.faceRecognitionNet.loadFromUri(resolvedModelPath),
        ]);
      } finally {
        restoreFetch();
      }

      onProgress?.("done");
    } catch (error) {
      MODEL_LOAD_PROMISES.delete(modelPath);
      throw error;
    }
  })();

  MODEL_LOAD_PROMISES.set(modelPath, loadPromise);
  await loadPromise;
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
 * @param {string} [modelPath="/models"] - The dummy base path for model loading
 * (actual files come from Cloudinary → IndexedDB).
 * @returns {Promise<FaceObservation | null>} A promise that resolves to the
 * face observation, or null when zero or multiple faces are detected.
 */
async function detectFaceObservationFromInput(
  input: FaceApiInput,
  modelPath = DEFAULT_MODEL_PATH,
): Promise<FaceObservation | null> {
  await loadModels(modelPath);
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
 * @param {string} [modelPath="/models"] - The dummy base path for model loading
 * (actual files come from Cloudinary → IndexedDB).
 * @returns {Promise<number[] | null>} A promise that resolves to the face
 * descriptor array, or null when no single face was detected.
 */
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
