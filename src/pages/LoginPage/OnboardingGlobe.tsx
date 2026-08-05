import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { PerspectiveCamera } from "three";
import { mulberry32 } from "@navyug/core";
import earthNightTexture from "../../assets/earth-night.jpg";
import { AMBIENT_CITIES, type Destination } from "./globeMilestones";

interface Ripple {
  id: number;
  lat: number;
  lng: number;
}

interface Route {
  from: Destination | null;
  to: Destination;
}

interface OnboardingGlobeProps {
  destination: Destination;
  active: boolean;
}

const RIPPLE_SEED = 20260723;
const RIPPLE_INTERVAL_MS = 1800;
const RIPPLE_LIFETIME_MS = 4200;
const GLOBE_ALTITUDE = 1.05;
const FLY_TO_DURATION_MS = 700;
// The card sits on the right side of the page (see index.tsx) — this shifts the camera's
// optical center so the focused marker actually lands in the page's clear left portion
// instead of the raw canvas midpoint, which would be partly behind the card.
const FOCUS_FRACTION_X = 0.32;

export default function OnboardingGlobe({ destination, active }: OnboardingGlobeProps) {
  const globeRef = useRef<GlobeMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  // Exactly one active leg at a time (previous screen's destination -> current one) — no
  // accumulated history of every screen ever visited. Going "back" to an already-visited
  // screen resolves (via getDestination) to the same destination it had before, so this
  // naturally reads as a return trip rather than a new leg forward.
  const [route, setRoute] = useState<Route>({ from: null, to: destination });
  const randRef = useRef(mulberry32(RIPPLE_SEED));
  const rippleIdRef = useRef(0);
  const rippleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Measures the actual container box (via ResizeObserver) rather than window.innerWidth/
  // innerHeight captured once at mount — this component mounts once and stays alive for the
  // rest of the session (see index.tsx), so a plain `resize`-event listener can leave the
  // canvas stuck at a stale size if the container's box changes for any reason other than an
  // explicit window resize (initial layout/font settling, scrollbar appearing/disappearing).
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Off-axis projection shift (Three.js's standard tiled-rendering mechanism, repurposed here
  // to recenter the optical axis rather than to tile) — keeps the focused marker landing in the
  // page's visible left portion at every size, not just whatever size was active on mount.
  useEffect(() => {
    if (!ready || size.width === 0 || size.height === 0) return;
    const camera = globeRef.current?.camera() as PerspectiveCamera | undefined;
    if (!camera) return;
    const { width, height } = size;
    const fullWidth = 2 * width * (1 - FOCUS_FRACTION_X);
    const offsetX = width * (1 - 2 * FOCUS_FRACTION_X);
    camera.setViewOffset(fullWidth, height, offsetX, 0, width, height);
    camera.updateProjectionMatrix();
  }, [ready, size]);

  useEffect(() => {
    return () => {
      if (rippleIntervalRef.current) clearInterval(rippleIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    // Purely decorative background — rotation is driven by autoRotate + the programmatic
    // fly-to only. Without this, OrbitControls' own mousedown/drag listener on the canvas can
    // swallow the first click over the globe (e.g. a card control that visually overlaps it),
    // showing a grab cursor instead of the expected one and eating that first click.
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
  }, []);

  useEffect(() => {
    if (active) {
      globeRef.current?.resumeAnimation();
    } else {
      globeRef.current?.pauseAnimation();
    }
  }, [active]);

  // Advance the single active leg whenever the current screen's destination changes.
  useEffect(() => {
    setRoute((prev) => (prev.to.key === destination.key ? prev : { from: prev.to, to: destination }));
  }, [destination]);

  // Fast directed "spin to the next point" whenever the destination changes (including the
  // very first one, once the globe is ready) — ambient slow auto-rotate otherwise keeps
  // drifting the rest of the time; this is the deliberate snap-to-target motion per screen.
  useEffect(() => {
    if (!ready) return;
    globeRef.current?.pointOfView({ lat: destination.lat, lng: destination.lng, altitude: GLOBE_ALTITUDE }, FLY_TO_DURATION_MS);
  }, [ready, destination]);

  function handleGlobeReady() {
    setReady(true);
    rippleIntervalRef.current = setInterval(() => {
      const rand = randRef.current;
      const city = AMBIENT_CITIES[Math.floor(rand() * AMBIENT_CITIES.length)]!;
      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev, { id, lat: city.lat, lng: city.lng }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, RIPPLE_LIFETIME_MS);
    }, RIPPLE_INTERVAL_MS);
  }

  const points = route.from ? [route.from, route.to] : [route.to];
  const arcs = route.from
    ? [
        {
          startLat: route.from.lat,
          startLng: route.from.lng,
          endLat: route.to.lat,
          endLng: route.to.lng,
        },
      ]
    : [];

  return (
    <div ref={containerRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {size.width > 0 && size.height > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          globeImageUrl={earthNightTexture}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere
          atmosphereColor="#2563EB"
          atmosphereAltitude={0.18}
          onGlobeReady={handleGlobeReady}
          pointsData={points}
          pointColor={(d) => ((d as Destination).key === route.to.key ? "#F8FAFC" : "rgba(248,250,252,.4)")}
          pointAltitude={0.015}
          pointRadius={(d) => ((d as Destination).key === route.to.key ? 0.55 : 0.35)}
          pointResolution={24}
          pointLabel={(d) => {
            const dest = d as Destination;
            return `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;color:#0B1220;background:#fff;padding:4px 9px;border-radius:6px;box-shadow:0 6px 16px rgba(0,0,0,.35)">${dest.label}</div>`;
          }}
          arcsData={arcs}
          arcColor={() => ["#BFDBFE", "#EFF6FF"]}
          arcStroke={0.28}
          arcDashLength={0.75}
          arcDashGap={0.06}
          arcDashAnimateTime={2600}
          arcsTransitionDuration={FLY_TO_DURATION_MS}
          ringsData={ripples}
          ringColor={() => (t: number) => `rgba(96,165,250,${1 - t})`}
          ringMaxRadius={3.5}
          ringPropagationSpeed={2.2}
          ringRepeatPeriod={1200}
        />
      )}
    </div>
  );
}
