import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import { Circle, MagnifyingGlass, Polygon, X } from "@phosphor-icons/react";
import { osmRasterStyle } from "../lib/mapStyle";
import { circleToPolygon, polygonCentroid } from "../lib/geo";
import type { Geofence } from "../types";

type DrawMode = "none" | "circle" | "polygon";
export type DrawnGeometry =
  | { shape: "Circle"; center: { lat: number; lng: number }; radiusKm: number }
  | { shape: "Polygon"; points: Array<[number, number]> };

interface GeofenceMapProps {
  geofences: Geofence[];
  selectedId?: string | null;
  onSelectGeofence?: (id: string) => void;
  onDrawComplete: (geometry: DrawnGeometry) => void;
  className?: string;
}

const EMPTY_FC = { type: "FeatureCollection" as const, features: [] as GeoJSON.Feature[] };

function geofenceToFeature(g: Geofence): GeoJSON.Feature | null {
  const ring = g.shape === "Circle" && g.center && g.radiusKm != null ? circleToPolygon(g.center, g.radiusKm) : g.points;
  if (!ring) return null;
  return {
    type: "Feature",
    id: g.id,
    properties: { id: g.id, name: g.name },
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

export function GeofenceMap({ geofences, selectedId, onSelectGeofence, onDrawComplete, className }: GeofenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const [ready, setReady] = useState(false);

  const [drawMode, setDrawMode] = useState<DrawMode>("none");
  const [circleCenter, setCircleCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [polygonPoints, setPolygonPoints] = useState<Array<[number, number]>>([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: [77.5, 21],
      zoom: 4.2,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("geofences", { type: "geojson", data: EMPTY_FC });
      map.addLayer({ id: "geofences-fill", type: "fill", source: "geofences", paint: { "fill-color": "#2563EB", "fill-opacity": 0.15 } });
      map.addLayer({ id: "geofences-line", type: "line", source: "geofences", paint: { "line-color": "#2563EB", "line-width": 2 } });
      map.addLayer({
        id: "geofences-fill-selected",
        type: "fill",
        source: "geofences",
        filter: ["==", ["get", "id"], ""],
        paint: { "fill-color": "#F59E0B", "fill-opacity": 0.25 },
      });
      map.addLayer({
        id: "geofences-line-selected",
        type: "line",
        source: "geofences",
        filter: ["==", ["get", "id"], ""],
        paint: { "line-color": "#F59E0B", "line-width": 3 },
      });

      map.addSource("draft", { type: "geojson", data: EMPTY_FC });
      map.addLayer({ id: "draft-fill", type: "fill", source: "draft", paint: { "fill-color": "#16A34A", "fill-opacity": 0.2 } });
      map.addLayer({ id: "draft-line", type: "line", source: "draft", paint: { "line-color": "#16A34A", "line-width": 2, "line-dasharray": [2, 1] } });

      map.on("click", "geofences-fill", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id && onSelectGeofence) onSelectGeofence(id);
      });
      map.on("mouseenter", "geofences-fill", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "geofences-fill", () => (map.getCanvas().style.cursor = ""));

      loadedRef.current = true;
      setReady(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render existing geofences whenever the list (or selection) changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("geofences") as GeoJSONSource | undefined;
    if (!source) return;
    const features = geofences.map(geofenceToFeature).filter((f): f is GeoJSON.Feature => f !== null);
    source.setData({ type: "FeatureCollection", features });
    map.setFilter("geofences-fill-selected", ["==", ["get", "id"], selectedId ?? ""]);
    map.setFilter("geofences-line-selected", ["==", ["get", "id"], selectedId ?? ""]);
  }, [geofences, selectedId, ready]);

  // Click handling for draw modes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.getCanvas().style.cursor = drawMode === "none" ? "" : "crosshair";

    function handleClick(e: maplibregl.MapMouseEvent) {
      if (drawMode === "circle") {
        setCircleCenter({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      } else if (drawMode === "polygon") {
        setPolygonPoints((pts) => [...pts, [e.lngLat.lng, e.lngLat.lat]]);
      }
    }
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [drawMode, ready]);

  // Live draft preview.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("draft") as GeoJSONSource | undefined;
    if (!source) return;

    if (drawMode === "circle" && circleCenter) {
      const ring = circleToPolygon(circleCenter, radiusKm);
      source.setData({ type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } }] });
    } else if (drawMode === "polygon" && polygonPoints.length > 0) {
      const geometry: GeoJSON.Geometry =
        polygonPoints.length >= 3
          ? { type: "Polygon", coordinates: [[...polygonPoints, polygonPoints[0]!]] }
          : { type: "LineString", coordinates: polygonPoints };
      source.setData({ type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry }] });
    } else {
      source.setData(EMPTY_FC);
    }
  }, [drawMode, circleCenter, radiusKm, polygonPoints, ready]);

  function resetDraw() {
    setDrawMode("none");
    setCircleCenter(null);
    setPolygonPoints([]);
    setRadiusKm(2);
  }

  function toggleDrawMode(mode: DrawMode) {
    const turningOff = drawMode === mode;
    resetDraw();
    if (!turningOff) setDrawMode(mode);
  }

  function confirmCircle() {
    if (!circleCenter) return;
    onDrawComplete({ shape: "Circle", center: circleCenter, radiusKm });
    resetDraw();
  }

  function confirmPolygon() {
    if (polygonPoints.length < 3) return;
    onDrawComplete({ shape: "Polygon", points: [...polygonPoints, polygonPoints[0]!] });
    resetDraw();
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search.trim())}`);
      const results = (await res.json()) as Array<{ lat: string; lon: string }>;
      const hit = results[0];
      if (hit && mapRef.current) {
        mapRef.current.flyTo({ center: [Number(hit.lon), Number(hit.lat)], zoom: 12 });
      }
    } catch {
      // demo-only geocoding lookup — silently ignore network/lookup failures
    } finally {
      setSearching(false);
    }
  }

  function flyToGeofence(g: Geofence) {
    const map = mapRef.current;
    if (!map) return;
    const centroid = g.shape === "Circle" && g.center ? g.center : g.points ? polygonCentroid(g.points) : null;
    if (centroid) map.flyTo({ center: [centroid.lng, centroid.lat], zoom: 12 });
  }

  useEffect(() => {
    if (!selectedId) return;
    const g = geofences.find((gf) => gf.id === selectedId);
    if (g) flyToGeofence(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="absolute inset-0" />

      <form onSubmit={handleSearch} className="absolute left-3 top-3 z-10 flex w-[280px] items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 shadow-popover">
        <MagnifyingGlass size={13} className="text-ink-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a place to center the map…"
          className="min-w-0 flex-1 font-sans text-[12px] font-medium text-ink outline-none placeholder:text-ink-faint"
        />
        <button type="submit" disabled={searching} className="font-sans text-[11.5px] font-bold text-brand disabled:opacity-50">
          {searching ? "…" : "Go"}
        </button>
      </form>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => toggleDrawMode("circle")}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-sans text-[11.5px] font-semibold shadow-popover transition-colors ${
            drawMode === "circle" ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:bg-surface-subtle"
          }`}
        >
          <Circle size={13} weight={drawMode === "circle" ? "fill" : "regular"} />
          Draw Circle
        </button>
        <button
          type="button"
          onClick={() => toggleDrawMode("polygon")}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-sans text-[11.5px] font-semibold shadow-popover transition-colors ${
            drawMode === "polygon" ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:bg-surface-subtle"
          }`}
        >
          <Polygon size={13} />
          Draw Polygon
        </button>
      </div>

      {drawMode === "circle" && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-popover">
          {!circleCenter ? (
            <span className="font-sans text-[12px] font-medium text-ink-muted">Click the map to place the center</span>
          ) : (
            <>
              <label className="flex items-center gap-2 font-sans text-[12px] font-medium text-ink-soft">
                Radius (km)
                <input
                  type="number"
                  min={0.2}
                  max={20}
                  step={0.1}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Math.max(0.2, Number(e.target.value)))}
                  className="w-16 rounded-md border border-line px-2 py-1 font-mono text-[12px]"
                />
              </label>
              <button type="button" onClick={confirmCircle} className="rounded-lg bg-brand px-3 py-1.5 font-sans text-[12px] font-bold text-white">
                Confirm
              </button>
            </>
          )}
          <button type="button" onClick={resetDraw} aria-label="Cancel drawing" className="text-ink-faint hover:text-ink">
            <X size={14} />
          </button>
        </div>
      )}

      {drawMode === "polygon" && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-popover">
          <span className="font-sans text-[12px] font-medium text-ink-muted">
            {polygonPoints.length < 3
              ? `Click to add points (${polygonPoints.length}/3 minimum)`
              : `${polygonPoints.length} points — add more or finish`}
          </span>
          <button
            type="button"
            onClick={confirmPolygon}
            disabled={polygonPoints.length < 3}
            className="rounded-lg bg-brand px-3 py-1.5 font-sans text-[12px] font-bold text-white disabled:opacity-40"
          >
            Finish Shape
          </button>
          <button type="button" onClick={resetDraw} aria-label="Cancel drawing" className="text-ink-faint hover:text-ink">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
