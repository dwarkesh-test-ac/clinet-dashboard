# client-dashboard

Fleet-owner web app — the dashboard a Navyug client signs into to see and manage their own fleet.

See the [repo root README](../../README.md) for project-wide context and
[CLAUDE.md](../../CLAUDE.md) for architecture/conventions.

## Run

```bash
pnpm --filter client-dashboard dev   # http://localhost:5173
```

Demo auth: any email + any password. Optionally open with `?client=blu` (or `grn`/`met`/`sur`) to
load as a specific admin-portal-known client — see `src/stores/authStore.ts`.

## Screens & routes

| Screen | Route |
|---|---|
| Login | `/login` |
| Dashboard | `/dashboard` |
| Live Map | `/live-map` |
| Real-Time Tracking | `/tracking/:vehicleId` |
| Trip History | `/trips/:tripId` |
| Vehicle Timeline | `/timeline` |
| Vehicle Statistics | `/vehicles` |
| Event Timeline (alerts) | `/events` |
| Reports | `/reports` |
| Report Results | `/reports/results` |
| Drivers | `/drivers` |
| Geofences | `/geofences` |
| Groups | `/groups` |
| Device Commands | `/devices` |
| Profile | `/profile` |
| Subscription | `/subscription` |
| Users | `/users` |

Route constants live in `src/config/routes.ts`; sidebar nav config in `src/config/nav.tsx`.

## Mock data model

Generated once per session in `src/lib/mock/generate.ts` (deterministic PRNG, stable across
reloads): ~140 vehicles (count adapts if opened with `?client=`), drivers, trips (with real
lat/lng waypoints for route rendering), alerts, geofences, groups, users, and a device-command
log. Held in `src/lib/mock/store.ts` (Zustand); a 5s interval jitters vehicle positions/speed for
a live-tracking feel. See `src/types/index.ts` for the full data shapes.

## Notable implementation details

- **Live Map / Tracking / Trip History** use a real MapLibre GL map (`src/components/FleetMap.tsx`,
  `RouteMap.tsx`) over OpenStreetMap tiles — dev/demo only, swap `src/lib/mapStyle.ts` before prod.
- **Vehicle/Driver/User lists** are virtualized (`@tanstack/react-virtual`) or paginated via the
  shared `DataTable` component from `packages/ui`.
- Route-level code splitting via `React.lazy` in `src/App.tsx`; page transitions handled in
  `src/layouts/AppShell.tsx` (single Suspense boundary with a fade-in — don't add another one
  higher up, it won't catch anything).
