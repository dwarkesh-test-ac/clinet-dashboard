import type { StyleSpecification } from "maplibre-gl";

/**
 * Raster OSM basemap — no API key required. Fine for this build/demo; a production deployment
 * should switch to a paid tile provider or self-hosted tiles per OSM's tile usage policy.
 */
export const osmRasterStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};
