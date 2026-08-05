import type {
  DeviceCommandLogEntry,
  DriverScorecard,
  Driver,
  DriverShift,
  FleetAlert,
  FleetUser,
  FuelOdometerEntry,
  Geofence,
  Invoice,
  InsurancePolicy,
  PaymentMethod,
  RegisteredDevice,
  Trip,
  UsageLedgerEntry,
  Vehicle,
  VehicleGroup,
  VehicleIconKey,
} from "../../types";
import { CITIES, GROUP_NAMES, fullName, regNumber } from "./pools";
import { mulberry32 } from "@navyug/core";

const INSURERS = ["ICICI Lombard", "Bajaj Allianz", "New India Assurance", "HDFC Ergo", "Tata AIG", "Reliance General"];
const CHASSIS_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

function chassisNumber(rand: () => number): string {
  let s = "MA3";
  for (let i = 0; i < 14; i++) s += CHASSIS_CHARS[Math.floor(rand() * CHASSIS_CHARS.length)];
  return s;
}

function deviceIdFor(rand: () => number): string {
  const num = 10000 + Math.floor(rand() * 89999);
  const suffix = String.fromCharCode(65 + Math.floor(rand() * 26));
  return `NVG-${num}-${suffix}`;
}

let TOTAL_VEHICLES = 142;
try {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const clientParam = searchParams ? (searchParams.get("client") || searchParams.get("clientId")) : null;
  const savedClient = clientParam || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("navyug.client") : null);
  const VEHICLE_COUNTS: Record<string, number> = {
    blu: 48,
    grn: 210,
    met: 86,
    sur: 134,
  };
  if (savedClient && VEHICLE_COUNTS[savedClient] !== undefined) {
    TOTAL_VEHICLES = VEHICLE_COUNTS[savedClient]!;
  }
} catch {
  // window/sessionStorage unavailable (e.g. SSR) — keep the 142-vehicle default
}

const MOVING = Math.round(TOTAL_VEHICLES * 0.67);
const STOPPED = Math.round(TOTAL_VEHICLES * 0.27);
const IDLE = TOTAL_VEHICLES - MOVING - STOPPED;

export interface MockWorld {
  groups: VehicleGroup[];
  drivers: Driver[];
  vehicles: Vehicle[];
  alerts: FleetAlert[];
  trips: Trip[];
  shifts: DriverShift[];
  geofences: Geofence[];
  users: FleetUser[];
  commandLog: DeviceCommandLogEntry[];
  devices: RegisteredDevice[];
  insurancePolicies: InsurancePolicy[];
  scorecards: DriverScorecard[];
  fuelOdometerEntries: FuelOdometerEntry[];
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  usageLedger: UsageLedgerEntry[];
  planCancelled: boolean;
  cycleEndDate: string;
}

function jitter(rand: () => number, spread: number) {
  return (rand() - 0.5) * 2 * spread;
}

const GROUP_ICONS: Record<string, VehicleIconKey> = {
  "Mumbai Distribution": "truck",
  "Delhi NCR Long Haul": "truck",
  "Cold Chain Fleet": "van",
  "Express Parcel": "bike",
  "Last Mile Bikes": "bike",
  "Bengaluru Ops": "car",
};

function kmToDegLat(km: number): number {
  return km / 111.32;
}
function kmToDegLng(km: number, atLat: number): number {
  return km / (111.32 * Math.cos((atLat * Math.PI) / 180));
}

/** Hand-rolled irregular ring around a center point — no turf/geo dependency needed. */
function polygonAround(
  rand: () => number,
  center: { lat: number; lng: number },
  avgRadiusKm: number,
  pointCount = 6,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const r = avgRadiusKm * (0.7 + rand() * 0.6);
    const dLat = kmToDegLat(r) * Math.sin(angle);
    const dLng = kmToDegLng(r, center.lat) * Math.cos(angle);
    points.push([center.lng + dLng, center.lat + dLat]);
  }
  points.push(points[0]!);
  return points;
}

export function generateWorld(seed = 20260711): MockWorld {
  const rand = mulberry32(seed);

  const groups: VehicleGroup[] = GROUP_NAMES.map((g, i) => ({
    id: `grp-${i + 1}`,
    name: g.name,
    description: g.description,
    managerName: fullName(rand),
    vehicleCount: 0,
    icon: GROUP_ICONS[g.name] ?? "truck",
  }));

  const statuses: Array<Vehicle["status"]> = [
    ...Array(MOVING).fill("moving"),
    ...Array(STOPPED).fill("stopped"),
    ...Array(IDLE).fill("idle"),
  ];

  const drivers: Driver[] = [];
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < TOTAL_VEHICLES; i++) {
    const city = CITIES[i % CITIES.length]!;
    const group = groups[i % groups.length]!;
    const status = statuses[i]!;
    const driverId = `drv-${i + 1}`;
    const isFirst = i === 0;

    drivers.push({
      id: driverId,
      name: isFirst ? "Rahul Sharma" : fullName(rand),
      phone: `+91 ${90000 + Math.floor(rand() * 9999)} ${10000 + Math.floor(rand() * 89999)}`,
      license: `${city.name.slice(0, 2).toUpperCase()}${1000000000 + Math.floor(rand() * 899999999)}`,
      vehicleId: `veh-${i + 1}`,
      groupId: group.id,
      status: rand() > 0.08 ? "active" : "inactive",
      joinedAt: new Date(2023, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString(),
    });

    // Realistic Indian commercial-fleet mix — EVs are still a minority, diesel dominates.
    const fuelRoll = rand();
    const fuelType: Vehicle["fuelType"] =
      fuelRoll < 0.15 ? "EV" : fuelRoll < 0.7 ? "Diesel" : fuelRoll < 0.9 ? "Petrol" : "CNG";

    vehicles.push({
      id: `veh-${i + 1}`,
      reg: isFirst ? "DL 1LAE 1234" : regNumber(rand),
      driverId,
      driverName: drivers[i]!.name,
      status,
      speedKmh: status === "moving" ? Math.round(28 + rand() * 55) : 0,
      lat: city.lat + jitter(rand, 0.12),
      lng: city.lng + jitter(rand, 0.12),
      heading: Math.round(rand() * 359),
      groupId: group.id,
      distanceTodayKm: Math.round((80 + rand() * 1200) * 10) / 10,
      tripsToday: Math.floor(rand() * 13),
      gpsOk: rand() > 0.04,
      ignitionOn: status !== "idle" || rand() > 0.5,
      fuelType,
      fuelPct: Math.round(15 + rand() * 85),
      batterySohPct: fuelType === "EV" ? Math.round(90 + rand() * 9) : null,
      lastUpdate: new Date(Date.now() - Math.floor(rand() * 90_000)).toISOString(),
    });

    group.vehicleCount++;
  }

  const ALERT_DEFS: Array<{ kind: FleetAlert["kind"]; title: string; severity: FleetAlert["severity"] }> = [
    { kind: "brake", title: "Harsh Braking", severity: "major" },
    { kind: "geo", title: "Geo-fence Breach", severity: "critical" },
    { kind: "speed", title: "Overspeeding", severity: "critical" },
    { kind: "device", title: "Device Disconnected", severity: "minor" },
  ];
  const alerts: FleetAlert[] = Array.from({ length: 48 }).map((_, i) => {
    const def = ALERT_DEFS[i % ALERT_DEFS.length]!;
    const v = vehicles[Math.floor(rand() * vehicles.length)]!;
    return {
      id: `alrt-${i + 1}`,
      kind: def.kind,
      title: def.title,
      vehicleId: v.id,
      vehicleReg: v.reg,
      occurredAt: new Date(Date.now() - Math.floor(rand() * 36) * 3_600_000).toISOString(),
      severity: def.severity,
    };
  });

  const trips: Trip[] = Array.from({ length: 220 }).map((_, i) => {
    const v = vehicles[i % vehicles.length]!;
    const startCity = CITIES[Math.floor(rand() * CITIES.length)]!;
    const started = new Date(Date.now() - Math.floor(rand() * 14) * 86_400_000 - Math.floor(rand() * 8) * 3_600_000);
    const durationMin = Math.round(25 + rand() * 220);
    const ended = new Date(started.getTime() + durationMin * 60_000);
    const avg = Math.round(24 + rand() * 40);
    const startLng = startCity.lng + jitter(rand, 0.1);
    const startLat = startCity.lat + jitter(rand, 0.1);
    const endLng = startCity.lng + jitter(rand, 0.1);
    const endLat = startCity.lat + jitter(rand, 0.1);
    const waypoints: Array<[number, number]> = [
      [startLng, startLat],
      [startLng + (endLng - startLng) * 0.35 + jitter(rand, 0.02), startLat + (endLat - startLat) * 0.35 + jitter(rand, 0.02)],
      [startLng + (endLng - startLng) * 0.7 + jitter(rand, 0.02), startLat + (endLat - startLat) * 0.7 + jitter(rand, 0.02)],
      [endLng, endLat],
    ];
    return {
      id: `trip-${i + 1}`,
      vehicleId: v.id,
      vehicleReg: v.reg,
      driverName: v.driverName,
      startedAt: started.toISOString(),
      endedAt: ended.toISOString(),
      startAddress: `${startCity.name} Depot, ${startCity.name}`,
      endAddress: `Sector ${1 + Math.floor(rand() * 60)}, ${startCity.name}`,
      distanceKm: Math.round(avg * (durationMin / 60) * 10) / 10,
      durationMin,
      avgSpeedKmh: avg,
      maxSpeedKmh: avg + Math.round(rand() * 35),
      idleMin: Math.round(rand() * 20),
      path: waypoints,
    };
  });

  const shiftCount = Math.min(30, drivers.length);
  const shifts: DriverShift[] = Array.from({ length: shiftCount }).map((_, i) => {
    const d = drivers[i]!;
    const v = vehicles.find((veh) => veh.id === d.vehicleId) ?? vehicles[i % vehicles.length]!;
    const vehicleTrips = trips.filter((t) => t.vehicleId === v.id);
    const isOngoing = i >= shiftCount - 3;

    let startedAt: Date;
    let endedAt: Date | null;
    if (vehicleTrips.length > 0) {
      const times = vehicleTrips.map((t) => new Date(t.startedAt).getTime());
      const endTimes = vehicleTrips.map((t) => new Date(t.endedAt).getTime());
      startedAt = new Date(Math.min(...times) - (15 + rand() * 30) * 60_000);
      endedAt = isOngoing ? null : new Date(Math.max(...endTimes) + (15 + rand() * 30) * 60_000);
    } else {
      const hoursAgo = isOngoing ? 1 + rand() * 3 : 12 + rand() * 300;
      startedAt = new Date(Date.now() - hoursAgo * 3_600_000);
      endedAt = isOngoing ? null : new Date(startedAt.getTime() + (6 + rand() * 3) * 3_600_000);
    }

    return {
      id: `shift-${i + 1}`,
      driverId: d.id,
      driverName: d.name,
      vehicleId: v.id,
      vehicleReg: v.reg,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt ? endedAt.toISOString() : null,
    };
  });

  const geofences: Geofence[] = Array.from({ length: 9 }).map((_, i) => {
    const city = CITIES[i % CITIES.length]!;
    const center = { lat: city.lat + jitter(rand, 0.05), lng: city.lng + jitter(rand, 0.05) };
    const shape: Geofence["shape"] = rand() > 0.4 ? "Circle" : "Polygon";
    const radiusKm = Math.round((1 + rand() * 4) * 10) / 10;
    return {
      id: `geo-${i + 1}`,
      name: `${city.name} ${["Warehouse", "Depot", "Customer Zone", "Restricted Zone"][i % 4]}`,
      shape,
      alertOn: (["Entry & Exit", "Entry Only", "Exit Only"] as const)[Math.floor(rand() * 3)]!,
      vehicleCount: 4 + Math.floor(rand() * 30),
      createdAt: new Date(2025, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString(),
      center,
      radiusKm: shape === "Circle" ? radiusKm : null,
      points: shape === "Polygon" ? polygonAround(rand, center, 1 + rand() * 3, 5 + Math.floor(rand() * 2)) : null,
    };
  });

  const users: FleetUser[] = [
    { id: "usr-1", name: "Demo User", email: "demo@shastrilogistics.in", role: "Owner", status: "active", lastActive: new Date().toISOString() },
    { id: "usr-2", name: "Amit Singh", email: "amit.singh@shastrilogistics.in", role: "Admin", status: "active", lastActive: new Date(Date.now() - 3_600_000).toISOString() },
    { id: "usr-3", name: "Neha Kapoor", email: "neha.kapoor@shastrilogistics.in", role: "Manager", status: "active", lastActive: new Date(Date.now() - 7_200_000).toISOString() },
    { id: "usr-4", name: "Ravi Iyer", email: "ravi.iyer@shastrilogistics.in", role: "Manager", status: "invited", lastActive: new Date(Date.now() - 86_400_000).toISOString() },
    { id: "usr-5", name: "Sunita Rao", email: "sunita.rao@shastrilogistics.in", role: "Viewer", status: "active", lastActive: new Date(Date.now() - 172_800_000).toISOString() },
  ];

  const COMMANDS = ["Request Location", "Immobilize Vehicle", "Reboot Device", "Set Overspeed Limit (70 km/h)", "Restore Mobility"];
  const commandLog: DeviceCommandLogEntry[] = Array.from({ length: 24 }).map((_, i) => {
    const v = vehicles[Math.floor(rand() * vehicles.length)]!;
    const status = (["Success", "Success", "Success", "Pending", "Failed"] as const)[Math.floor(rand() * 5)]!;
    return {
      id: `cmd-${i + 1}`,
      time: new Date(Date.now() - i * 3_400_000).toISOString(),
      vehicleReg: v.reg,
      command: COMMANDS[Math.floor(rand() * COMMANDS.length)]!,
      by: rand() > 0.5 ? "Demo User" : fullName(rand),
      status,
    };
  });

  const deviceCount = Math.min(24, vehicles.length);
  const devices: RegisteredDevice[] = Array.from({ length: deviceCount }).map((_, i) => {
    const v = vehicles[i]!;
    const status = i < deviceCount - 2 ? "Active" : (["Provisioning", "Inactive"] as const)[i % 2]!;
    return {
      id: `dev-${i + 1}`,
      deviceId: deviceIdFor(rand),
      vehicleReg: v.reg,
      chassisNo: chassisNumber(rand),
      addedAt: new Date(2025, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)).toISOString(),
      status,
    };
  });

  const policyCount = Math.min(30, vehicles.length);
  const insurancePolicies: InsurancePolicy[] = Array.from({ length: policyCount }).map((_, i) => {
    const v = vehicles[i]!;
    const daysToExpiry = Math.round(-20 + rand() * 160);
    const status = daysToExpiry < 0 ? "Expired" : daysToExpiry <= 30 ? "Expiring" : "Active";
    return {
      id: `ins-${i + 1}`,
      vehicleId: v.id,
      vehicleReg: v.reg,
      insurer: INSURERS[Math.floor(rand() * INSURERS.length)]!,
      policyNo: `${v.reg.slice(0, 2)}-${v.reg.slice(3, 5)}-${7000000 + Math.floor(rand() * 2999999)}`,
      type: rand() > 0.25 ? "Comprehensive" : "Third-party only",
      idv: Math.round((6 + rand() * 12) * 100_000),
      premium: Math.round((16 + rand() * 30) * 1000),
      expiryDate: new Date(Date.now() + daysToExpiry * 86_400_000).toISOString(),
      status,
    };
  });

  const scorecardCount = Math.min(30, drivers.length);
  const scorecards: DriverScorecard[] = Array.from({ length: scorecardCount }).map((_, i) => {
    const d = drivers[i]!;
    const v = vehicles.find((veh) => veh.id === d.vehicleId);
    const group = groups.find((g) => g.id === d.groupId);
    const score = i === 0 ? 92 : Math.round(55 + rand() * 44);
    const grade = score >= 85 ? "A" : score >= 70 ? "B" : "C";
    const jitter5 = () => Math.round(score + (rand() - 0.5) * 20);
    return {
      driverId: d.id,
      driverName: d.name,
      vehicleReg: v?.reg ?? "—",
      groupName: group?.name ?? "Unassigned",
      score,
      grade,
      distance30Km: Math.round(1800 + rand() * 3200),
      trips30: 40 + Math.floor(rand() * 70),
      breakdown: {
        speed: Math.max(20, Math.min(100, jitter5())),
        braking: Math.max(20, Math.min(100, jitter5())),
        acceleration: Math.max(20, Math.min(100, jitter5())),
        cornering: Math.max(20, Math.min(100, jitter5())),
        idle: Math.max(20, Math.min(100, jitter5())),
      },
      riskEvents: {
        overspeeding: Math.max(0, Math.round((100 - score) / 8 + rand() * 3)),
        harshBraking: Math.max(0, Math.round((100 - score) / 10 + rand() * 3)),
        harshAcceleration: Math.max(0, Math.round((100 - score) / 10 + rand() * 2)),
        sharpCornering: Math.max(0, Math.round((100 - score) / 12 + rand() * 2)),
        excessIdling: Math.max(0, Math.round((100 - score) / 9 + rand() * 4)),
      },
    };
  });

  const fuelRecordCount = Math.min(40, vehicles.length);
  const fuelOdometerEntries: FuelOdometerEntry[] = Array.from({ length: fuelRecordCount }).map((_, i) => {
    const v = vehicles[(i + 5) % vehicles.length]!;
    const fuelLitres = Math.round((30 + rand() * 40) * 10) / 10;
    const odometerKm = 15000 + Math.floor(rand() * 90000);
    const prevOdo = odometerKm - Math.round(80 + rand() * 260);
    return {
      id: `fo-${i + 1}`,
      vehicleReg: v.reg,
      date: new Date(Date.now() - Math.floor(rand() * 14) * 86_400_000).toISOString(),
      prevOdo,
      odometerKm,
      fuelLitres,
      cost: Math.round(fuelLitres * 96),
    };
  });

  const paymentMethods: PaymentMethod[] = [
    { id: "pm-1", type: "upi", label: "UPI Mandate", detail: "shastri.logistics@okhdfc", isPrimary: true },
    { id: "pm-2", type: "card", label: "HDFC Business Card", detail: "•••• 4821 · Exp 08/28", isPrimary: false },
  ];

  const invoices: Invoice[] = Array.from({ length: 12 }).map((_, i) => {
    const monthsAgo = 12 - i;
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    const cycleStart = new Date(d.getFullYear(), d.getMonth(), 12);
    const cycleEnd = new Date(d.getFullYear(), d.getMonth() + 1, 11);
    const amount = Math.round(TOTAL_VEHICLES * (149 + rand() * 60) * 1.18);
    return {
      id: `NVG-2026-${(600 + i).toString().padStart(4, "0")}`,
      cycleLabel: `${cycleStart.toLocaleDateString("en-IN", { month: "short" })}–${cycleEnd.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`,
      amount,
      status: i === 11 ? "Due" : "Paid",
    };
  });

  const usageLedger: UsageLedgerEntry[] = Array.from({ length: 8 }).map((_, i) => {
    const events = [
      { label: "Device added", daysMagnitude: 18 + Math.floor(rand() * 10), sign: 1 },
      { label: "Device removed", daysMagnitude: 5 + Math.floor(rand() * 8), sign: -1 },
      { label: "Mid-cycle upgrade", daysMagnitude: 10 + Math.floor(rand() * 8), sign: 1 },
    ];
    const e = events[i % events.length]!;
    return {
      id: `ul-${i + 1}`,
      date: new Date(Date.now() - Math.floor(rand() * 19) * 86_400_000).toISOString(),
      event: e.label,
      days: e.daysMagnitude,
      amount: Math.round(e.sign * (e.daysMagnitude / 30) * 149),
    };
  });

  const cycleEndDate = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 11).toISOString();
  })();

  return {
    groups,
    drivers,
    vehicles,
    alerts,
    trips,
    shifts,
    geofences,
    users,
    commandLog,
    devices,
    insurancePolicies,
    scorecards,
    fuelOdometerEntries,
    paymentMethods,
    invoices,
    usageLedger,
    planCancelled: false,
    cycleEndDate,
  };
}
