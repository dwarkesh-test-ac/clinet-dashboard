// import { useEffect, useRef } from "react";
// import maplibregl from "maplibre-gl";
// import { osmRasterStyle } from "../lib/mapStyle";

// export interface RouteMapProps {
//   path: Array<[number, number]>;
//   className?: string;
// }

// const ROUTE_SOURCE_ID = "trip-route";

// export function RouteMap({ path, className }: RouteMapProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const mapRef = useRef<maplibregl.Map | null>(null);
//   const startMarker = useRef<maplibregl.Marker | null>(null);
//   const endMarker = useRef<maplibregl.Marker | null>(null);

//   useEffect(() => {
//     if (!containerRef.current || path.length === 0) return;

//     const map = new maplibregl.Map({
//       container: containerRef.current,
//       style: osmRasterStyle,
//       center: path[0],
//       zoom: 11,
//     });
//     mapRef.current = map;

//     map.on("load", () => {
//       map.addSource(ROUTE_SOURCE_ID, {
//         type: "geojson",
//         data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path } },
//       });
//       map.addLayer({
//         id: ROUTE_SOURCE_ID,
//         type: "line",
//         source: ROUTE_SOURCE_ID,
//         layout: { "line-join": "round", "line-cap": "round" },
//         paint: { "line-color": "#16A34A", "line-width": 4 },
//       });

//       const startEl = document.createElement("div");
//       startEl.style.cssText =
//         "width:24px;height:24px;border-radius:50%;background:#16A34A;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;";
//       startEl.textContent = "S";
//       startMarker.current = new maplibregl.Marker({ element: startEl }).setLngLat(path[0]!).addTo(map);

//       const endEl = document.createElement("div");
//       endEl.style.cssText =
//         "width:24px;height:24px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;";
//       endEl.textContent = "E";
//       endMarker.current = new maplibregl.Marker({ element: endEl }).setLngLat(path[path.length - 1]!).addTo(map);

//       const bounds = path.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(path[0]!, path[0]!));
//       map.fitBounds(bounds, { padding: 56, animate: false });
//     });

//     return () => {
//       map.remove();
//       mapRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [path.length]);

//   return <div ref={containerRef} className={className} role="img" aria-label="Trip route map" />;
// }
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { osmRasterStyle } from "../lib/mapStyle";
import { useMockWorldStore } from "../lib/mock/store";
import type { Trip } from "../types";

export interface RouteMapProps {
  path?: Array<[number, number]>;
  tripId?: string;
  className?: string;
}

export function RouteMap({ path, tripId, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Fallback to store if only tripId is passed, or construct route from path prop
  useEffect(() => {
    if (tripId) {
      const mockTrips = useMockWorldStore.getState().trips;
      const found = mockTrips.find((t) => t.id === tripId);
      if (found) {
        setTrip(found);
        return;
      }
    }

    if (path && path.length > 0) {
      setTrip({
        id: "custom-path",
        vehicleId: "",
        vehicleReg: "",
        driverName: "",
        startedAt: "",
        endedAt: "",
        startAddress: "",
        endAddress: "",
        distanceKm: 0,
        durationMin: 0,
        avgSpeedKmh: 0,
        maxSpeedKmh: 0,
        idleMin: 0,
        path,
      });
    }
  }, [tripId, path]);

  // Setup MapLibre 3D Scene
  useEffect(() => {
    if (!containerRef.current || !trip || trip.path.length === 0) return;

    const startPos = trip.path[0]!;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: startPos,
      zoom: 15,
      pitch: 60,
      bearing: -17.6,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("replay-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: trip.path },
        },
      });

      map.addLayer({
        id: "replay-route-line",
        type: "line",
        source: "replay-route",
        paint: {
          "line-color": "#16A34A",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      });

      const el = document.createElement("div");
      el.style.cssText =
        "width:32px;height:32px;border-radius:50%;background:#16A34A;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;";
      el.innerHTML = "🚚";

      markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(startPos).addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trip]);

  // Handle Playback Loop
  useEffect(() => {
    if (!isPlaying || !trip || trip.path.length <= 1) return;

    const intervalTime = 1000 / speedMultiplier;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= trip.path.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, trip, speedMultiplier]);

  // Update map position and camera angle during replay
  useEffect(() => {
    if (!trip || !mapRef.current || !markerRef.current) return;

    const currentCoords = trip.path[currentIndex];
    if (!currentCoords) return;

    markerRef.current.setLngLat(currentCoords);

    let bearing = mapRef.current.getBearing();
    if (currentIndex < trip.path.length - 1) {
      const nextCoords = trip.path[currentIndex + 1]!;
      const dLng = nextCoords[0] - currentCoords[0];
      const dLat = nextCoords[1] - currentCoords[1];
      bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    }

    mapRef.current.easeTo({
      center: currentCoords,
      bearing,
      duration: 800 / speedMultiplier,
      pitch: 60,
    });
  }, [currentIndex, trip, speedMultiplier]);

  if (!trip || trip.path.length === 0) {
    return <div className={`relative ${className ?? ""}`} role="img" aria-label="Trip route map" />;
  }

  return (
    <div className={`relative ${className ?? ""}`} role="img" aria-label="Trip route map">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Playback Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-xl border border-line bg-white/95 px-4 py-2 shadow-popover backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white hover:opacity-90 transition"
        >
          {isPlaying ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setCurrentIndex(0);
          }}
          className="p-1.5 text-ink-muted hover:text-ink"
          title="Reset"
        >
          <ArrowCounterClockwise size={16} />
        </button>

        <input
          type="range"
          min={0}
          max={trip.path.length - 1}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-36 cursor-pointer accent-brand"
        />

        <select
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
          className="rounded-md border border-line bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </div>
  );
}