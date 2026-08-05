import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import maplibregl from "maplibre-gl";
import { osmRasterStyle } from "../lib/mapStyle";
import { useMockWorldStore, startLiveTicker } from "../lib/mock/store";

interface CustomerLiveShareProps {
  shareToken?: string;
  vehicleId?: string;
}

export function CustomerLiveShare({ shareToken: propToken, vehicleId: propVehId }: CustomerLiveShareProps) {
  const params = useParams<{ shareToken?: string }>();
  const [searchParams] = useSearchParams();

  // Extract share token and vehicle ID from props or URL
  const activeToken = propToken || params.shareToken || "demo-token";
  const targetVehicleId = propVehId || searchParams.get("vehicleId") || "veh-1";

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Start live GPS movement updates
  useEffect(() => {
    startLiveTicker();
  }, []);

  // Subscribe directly to Zustand store for real-time status updates
  const vehicle = useMockWorldStore((s) =>
    s.vehicles.find((v) => v.id === targetVehicleId) || s.vehicles[0]
  );

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = vehicle ? [vehicle.lng, vehicle.lat] : [77.5, 21];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: initialCenter,
      zoom: 14,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position and map camera when live vehicle coordinates/status change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !vehicle) return;

    const coords: [number, number] = [vehicle.lng, vehicle.lat];

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:36px;height:36px;border-radius:50%;background:#10B981;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;";
      el.innerHTML = "🚚";
      markerRef.current = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map);
      map.flyTo({ center: coords, zoom: 15 });
    } else {
      markerRef.current.setLngLat(coords);
      map.easeTo({ center: coords, duration: 1000 });
    }
  }, [vehicle]);

  return (
    <div className="relative h-full w-full min-h-[400px]">
      <div ref={containerRef} className="absolute inset-0" />
      {vehicle && (
        <div className="absolute top-4 left-4 z-10 rounded-xl bg-white p-4 shadow-lg border border-gray-100 min-w-[240px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Live Sharing</span>
          </div>

          <div className="mt-2 text-sm font-bold text-gray-800">{vehicle.driverName}</div>
          <div className="text-xs text-gray-500 font-mono">{vehicle.reg}</div>

          {/* Live Status Indicators */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-semibold text-emerald-600 capitalize">{vehicle.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Speed:</span>
              <span className="font-mono font-bold text-gray-800">{vehicle.speedKmh} km/h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">GPS Status:</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
              <span>Token:</span>
              <span className="font-mono truncate max-w-[120px]">{activeToken}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}