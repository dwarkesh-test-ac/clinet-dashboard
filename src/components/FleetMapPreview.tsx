import { Link } from "react-router-dom";
import type { Vehicle } from "../types";
import { routes } from "../config/routes";
import { FleetMap } from "./FleetMap";

export function FleetMapPreview({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <Link
      to={routes.liveMap}
      aria-label="Open live map"
      className="relative block h-[200px] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
    >
      <FleetMap vehicles={vehicles} interactive={false} className="pointer-events-none h-full w-full" />
    </Link>
  );
}
