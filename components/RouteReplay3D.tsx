import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { osmRasterStyle } from "../lib/mapStyle";
import { useMockWorldStore } from "../lib/mock/store";
import type { Trip } from "../types";

interface RouteReplay3DProps {
  tripId: string;
}

export function RouteReplay3D({ tripId }: RouteReplay3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // MOCK DATA IMPLEMENTATION
  useEffect(() => {
    const mockTrips = useMockWorldStore.getState().trips;
    const found = mockTrips.find((t) => t.id === tripId) || mockTrips[0];
    if (found) setTrip(found);
  }, [tripId]);

  /*
  // PRODUCTION DATA IMPLEMENTATION (UNCOMMENT FOR PRODUCTION BACKEND)
  useEffect(() => {
    async function fetchTripPath() {
      try {
        const response = await fetch(`/api/v1/trips/${tripId}/path`);
        const data = await response.json();
        setTrip(data);
      } catch (err) {
        console.error("Error fetching trip route replay:", err);
      }
    }
    fetchTripPath();
  }, [tripId]);
  */

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
          "line-color": "#2563EB",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      });

      const el = document.createElement("div");
      el.style.cssText =
        "width:32px;height:32px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;";
      el.innerHTML = "🚚";

      markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(startPos).addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trip]);

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

  if (!trip) return <div className="p-4 text-xs font-sans text-gray-500">Loading trip replay...</div>;

  return (
    <div className="relative h-full w-full min-h-[350px]">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 rounded-xl border border-gray-200 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setCurrentIndex(0);
          }}
          className="p-2 text-gray-600 hover:text-gray-900"
          title="Reset"
        >
          <ArrowCounterClockwise size={18} />
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
          className="w-48 cursor-pointer accent-blue-600"
        />

        <select
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1 font-mono text-xs font-semibold text-gray-700"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </div>
  );
}