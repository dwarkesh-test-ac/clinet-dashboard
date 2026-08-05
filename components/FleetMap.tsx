import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import maplibregl from "maplibre-gl";
import { Bus, Car, Motorcycle, Truck, Van } from "@phosphor-icons/react";
import type { Vehicle, VehicleIconKey } from "../types";
import { osmRasterStyle } from "../lib/mapStyle";

const STATUS_COLOR: Record<Vehicle["status"], string> = {
  moving: "#22C55E",
  stopped: "#EF4444",
  idle: "#F59E0B",
  nodata: "#9CA3AF",
};

const ICON_COMPONENTS: Record<VehicleIconKey, typeof Truck> = {
  truck: Truck,
  van: Van,
  bike: Motorcycle,
  bus: Bus,
  car: Car,
};

function iconMarkup(icon: VehicleIconKey, size: number): string {
  const Icon = ICON_COMPONENTS[icon] ?? Truck;
  return renderToStaticMarkup(<Icon size={size} weight="fill" color="#fff" />);
}

function markerEl(color: string, icon: VehicleIconKey, selected: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = selected ? "28px" : "22px";
  el.style.height = selected ? "28px" : "22px";
  el.style.borderRadius = "7px 7px 7px 0";
  el.style.background = color;
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,.3)";
  el.style.cursor = "pointer";
  el.style.transform = "rotate(45deg)";
  const inner = document.createElement("div");
  inner.style.transform = "rotate(-45deg)";
  inner.style.width = "100%";
  inner.style.height = "100%";
  inner.style.display = "flex";
  inner.style.alignItems = "center";
  inner.style.justifyContent = "center";
  inner.innerHTML = iconMarkup(icon, selected ? 14 : 11);
  el.appendChild(inner);
  return el;
}

export interface FleetMapProps {
  vehicles: Vehicle[];
  selectedId?: string;
  onSelectVehicle?: (id: string) => void;
  /** Maps a vehicle's groupId to its chosen preset icon (see GroupsPage). Falls back to "truck". */
  groupIcons?: Record<string, VehicleIconKey>;
  interactive?: boolean;
  className?: string;
}

export function FleetMap({ vehicles, selectedId, onSelectVehicle, groupIcons, interactive = true, className }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const markerIconRef = useRef<Map<string, VehicleIconKey>>(new Map());
  const fitDoneRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: [77.5, 21],
      zoom: 4.2,
      interactive,
      attributionControl: interactive ? undefined : false,
    });
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    }
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    for (const v of vehicles) {
      seen.add(v.id);
      const selected = v.id === selectedId;
      const icon = groupIcons?.[v.groupId] ?? "truck";
      let marker = markersRef.current.get(v.id);
      const iconChanged = marker && markerIconRef.current.get(v.id) !== icon;
      if (marker && iconChanged) {
        marker.remove();
        markersRef.current.delete(v.id);
        marker = undefined;
      }
      if (!marker) {
        const el = markerEl(STATUS_COLOR[v.status], icon, selected);
        if (onSelectVehicle) {
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelectVehicle(v.id);
          });
        }
        marker = new maplibregl.Marker({ element: el }).setLngLat([v.lng, v.lat]).addTo(map);
        markersRef.current.set(v.id, marker);
        markerIconRef.current.set(v.id, icon);
      } else {
        marker.setLngLat([v.lng, v.lat]);
      }
    }
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
        markerIconRef.current.delete(id);
      }
    }

    if (!fitDoneRef.current && vehicles.length > 0) {
      fitDoneRef.current = true;
      const bounds = vehicles.reduce(
        (b, v) => b.extend([v.lng, v.lat]),
        new maplibregl.LngLatBounds([vehicles[0]!.lng, vehicles[0]!.lat], [vehicles[0]!.lng, vehicles[0]!.lat]),
      );
      map.fitBounds(bounds, { padding: 48, maxZoom: 11, animate: false });
    }
  }, [vehicles, selectedId, onSelectVehicle, groupIcons]);

  return <div ref={containerRef} className={className} role={interactive ? undefined : "img"} aria-label={interactive ? undefined : "Fleet map preview"} />;
}
