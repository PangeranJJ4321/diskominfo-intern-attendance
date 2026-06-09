import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";

export const DEFAULT_MAP_CENTER: [number, number] = [-2.9761, 104.7754]; // Palembang, South Sumatra

/**
 * Extracts individual GeoJSON layers from a GeoJSON object.
 * If the object is a FeatureCollection, each feature is returned as a separate layer.
 */
export function extractGeoJsonLayers(
  geoData: GeoJsonObject | null,
): GeoJsonObject[] {
  if (!geoData) return [];
  if (
    "features" in geoData &&
    Array.isArray((geoData as FeatureCollection).features)
  ) {
    const fc = geoData as FeatureCollection;
    return fc.features.map((f) => f as GeoJsonObject);
  }
  return [geoData];
}

/**
 * Converts an array of GeoJSON layers into a single FeatureCollection.
 * Handles FeatureCollections, Features, and raw geometries.
 */
export function toFeatureCollection(
  layers: GeoJsonObject[],
): FeatureCollection {
  const features = layers.flatMap((layer) => {
    if (
      "features" in layer &&
      Array.isArray((layer as FeatureCollection).features)
    ) {
      const fc = layer as FeatureCollection;
      return fc.features.map((f) => f as Feature);
    }
    if ("geometry" in layer && (layer as Feature).type === "Feature") {
      return [layer as Feature];
    }
    return [{ type: "Feature", properties: {}, geometry: layer } as Feature];
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Computes the geographic center (centroid) of a GeoJSON object
 * by averaging all coordinate points.
 * Returns DEFAULT_MAP_CENTER if no points are found.
 */
export function getGeoJsonCenter(
  geoData: GeoJsonObject | null,
): [number, number] {
  if (!geoData) return DEFAULT_MAP_CENTER;

  const points: Array<[number, number]> = [];
  type CoordinateValue = number | CoordinateValue[];
  const collectPoints = (value: CoordinateValue): void => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      points.push([value[1], value[0]]);
      return;
    }
    for (const entry of value) {
      collectPoints(entry);
    }
  };

  if (
    "features" in geoData &&
    Array.isArray((geoData as FeatureCollection).features)
  ) {
    const fc = geoData as FeatureCollection;
    for (const feature of fc.features) {
      if (feature.type === "Feature" && feature.geometry) {
        const geom = feature.geometry;
        if ("coordinates" in geom && geom.coordinates !== undefined) {
          collectPoints(geom.coordinates as CoordinateValue);
        } else if ("geometries" in geom && Array.isArray(geom.geometries)) {
          for (const g of geom.geometries) {
            if ("coordinates" in g && g.coordinates !== undefined) {
              collectPoints(g.coordinates as CoordinateValue);
            }
          }
        }
      }
    }
  } else if ("geometry" in geoData && (geoData as Feature).geometry) {
    const geom = (geoData as Feature).geometry;
    if (geom && "coordinates" in geom && geom.coordinates !== undefined) {
      collectPoints(geom.coordinates as CoordinateValue);
    } else if (geom && "geometries" in geom && Array.isArray(geom.geometries)) {
      for (const g of geom.geometries) {
        if ("coordinates" in g && g.coordinates !== undefined) {
          collectPoints(g.coordinates as CoordinateValue);
        }
      }
    }
  } else if (geoData) {
    const geom = geoData;
    if ("coordinates" in geom && geom.coordinates !== undefined) {
      collectPoints(geom.coordinates as CoordinateValue);
    } else if ("geometries" in geom && Array.isArray(geom.geometries)) {
      for (const g of geom.geometries) {
        if ("coordinates" in g && g.coordinates !== undefined) {
          collectPoints(g.coordinates as CoordinateValue);
        }
      }
    }
  }

  if (points.length === 0) return DEFAULT_MAP_CENTER;

  const total = points.reduce(
    (accumulator, [lat, lng]) => {
      accumulator[0] += lat;
      accumulator[1] += lng;
      return accumulator;
    },
    [0, 0],
  );

  return [total[0] / points.length, total[1] / points.length];
}
