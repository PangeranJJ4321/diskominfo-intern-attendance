import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  Geometry,
  Position,
} from "geojson";

type Ring = Position[];
type PolygonCoordinates = Ring[];

function isPointOnSegment(
  point: Position,
  start: Position,
  end: Position,
): boolean {
  const crossProduct =
    (point[1] - start[1]) * (end[0] - start[0]) -
    (point[0] - start[0]) * (end[1] - start[1]);
  if (Math.abs(crossProduct) > 1e-7) {
    return false;
  }
  const minX = Math.min(start[0], end[0]);
  const maxX = Math.max(start[0], end[0]);
  const minY = Math.min(start[1], end[1]);
  const maxY = Math.max(start[1], end[1]);
  return (
    point[0] >= minX - 1e-7 &&
    point[0] <= maxX + 1e-7 &&
    point[1] >= minY - 1e-7 &&
    point[1] <= maxY + 1e-7
  );
}

function isPointInRing(point: Position, ring: Ring): boolean {
  if (ring.length < 3) {
    return false;
  }
  let isInside = false;
  for (
    let index = 0, previousIndex = ring.length - 1;
    index < ring.length;
    previousIndex = index++
  ) {
    const start = ring[previousIndex];
    const end = ring[index];
    if (isPointOnSegment(point, start, end)) {
      return true;
    }
    const intersects =
      start[1] > point[1] !== end[1] > point[1] &&
      point[0] <
        ((end[0] - start[0]) * (point[1] - start[1])) / (end[1] - start[1]) +
          start[0];
    if (intersects) {
      isInside = !isInside;
    }
  }
  return isInside;
}

function extractPolygons(
  geometry: Geometry | null | undefined,
): PolygonCoordinates[] {
  if (!geometry) {
    return [];
  }
  switch (geometry.type) {
    case "Polygon":
      return [geometry.coordinates];
    case "MultiPolygon":
      return geometry.coordinates;
    case "GeometryCollection":
      return geometry.geometries.flatMap((nestedGeometry) =>
        extractPolygons(nestedGeometry),
      );
    default:
      return [];
  }
}

function collectPolygons(
  geoData: GeoJsonObject | Geometry | null,
): PolygonCoordinates[] {
  if (!geoData) {
    return [];
  }
  if (geoData.type === "FeatureCollection") {
    const collection = geoData as FeatureCollection;
    return collection.features.flatMap((feature: Feature) =>
      collectPolygons(
        (feature.geometry as Geometry | null | undefined) ?? null,
      ),
    );
  }
  if (geoData.type === "Feature") {
    const feature = geoData as Feature;
    return extractPolygons(feature.geometry as Geometry | null | undefined);
  }
  return extractPolygons(geoData as Geometry);
}

export function isLocationWithinArea(
  latitude: number,
  longitude: number,
  geoData: GeoJsonObject | null,
): boolean | null {
  const polygons = collectPolygons(geoData);
  if (polygons.length === 0) {
    return null;
  }
  const point: Position = [longitude, latitude];
  return polygons.some((polygon) => {
    if (polygon.length === 0) {
      return false;
    }
    const [outerRing, ...holes] = polygon;
    if (!isPointInRing(point, outerRing)) {
      return false;
    }
    return !holes.some((hole) => isPointInRing(point, hole));
  });
}
