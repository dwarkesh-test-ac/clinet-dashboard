const EARTH_RADIUS_KM = 6371;

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Approximates a circle (center + radius) as a closed ring of [lng, lat] points — MapLibre has no
 * native "circle by kilometres" primitive, so Circle geofences are rendered as a many-point
 * polygon. Haversine-based, no turf/geo dependency needed.
 */
export function circleToPolygon(center: LatLng, radiusKm: number, points = 48): Array<[number, number]> {
  const ring: Array<[number, number]> = [];
  const latRad = (center.lat * Math.PI) / 180;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI) * Math.sin(angle);
    const dLng = ((radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI) * Math.cos(angle)) / Math.cos(latRad);
    ring.push([center.lng + dLng, center.lat + dLat]);
  }
  return ring;
}

/** Simple average-of-vertices centroid — good enough for flying the map to a drawn/stored shape. */
export function polygonCentroid(points: Array<[number, number]>): LatLng {
  const n = points.length || 1;
  const sum = points.reduce((acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }), { lng: 0, lat: 0 });
  return { lat: sum.lat / n, lng: sum.lng / n };
}
