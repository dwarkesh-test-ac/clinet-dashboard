export type VehicleStatus = "moving" | "stopped" | "idle" | "nodata";

export type FuelType = "EV" | "Diesel" | "Petrol" | "CNG";

export interface Vehicle {
  id: string;
  reg: string;
  driverId: string;
  driverName: string;
  status: VehicleStatus;
  speedKmh: number;
  lat: number;
  lng: number;
  heading: number;
  groupId: string;
  distanceTodayKm: number;
  tripsToday: number;
  gpsOk: boolean;
  ignitionOn: boolean;
  fuelType: FuelType;
  /** Fuel level (%) for combustion vehicles, battery state-of-charge (%) for EVs. */
  fuelPct: number;
  /** Battery state-of-health (%) — only meaningful when fuelType is "EV". */
  batterySohPct: number | null;
  lastUpdate: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  vehicleId: string | null;
  groupId: string;
  status: "active" | "inactive";
  joinedAt: string;
}

export interface DriverShift {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleReg: string;
  startedAt: string;
  /** null while the shift is still open/ongoing. */
  endedAt: string | null;
}

export type AlertKind = "brake" | "geo" | "speed" | "device";

export interface FleetAlert {
  id: string;
  kind: AlertKind;
  title: string;
  vehicleId: string;
  vehicleReg: string;
  occurredAt: string;
  severity: "critical" | "major" | "minor";
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicleReg: string;
  driverName: string;
  startedAt: string;
  endedAt: string;
  startAddress: string;
  endAddress: string;
  distanceKm: number;
  durationMin: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  idleMin: number;
  path: Array<[number, number]>;
}

export interface Geofence {
  id: string;
  name: string;
  shape: "Circle" | "Polygon";
  alertOn: "Entry & Exit" | "Entry Only" | "Exit Only";
  vehicleCount: number;
  createdAt: string;
  center: { lat: number; lng: number } | null;
  /** Only set when shape is "Circle". */
  radiusKm: number | null;
  /** Only set when shape is "Polygon" — [lng, lat] pairs, closed or open ring. */
  points: Array<[number, number]> | null;
}

export type VehicleIconKey = "truck" | "van" | "bike" | "bus" | "car";

export interface VehicleGroup {
  id: string;
  name: string;
  description: string;
  managerName: string;
  vehicleCount: number;
  icon: VehicleIconKey;
}

export interface DeviceCommandLogEntry {
  id: string;
  time: string;
  vehicleReg: string;
  command: string;
  by: string;
  status: "Success" | "Pending" | "Failed";
}

export type UserRole = "Owner" | "Admin" | "Manager" | "Viewer";

export interface FleetUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited";
  lastActive: string;
}

export interface KpiSummary {
  totalVehicles: number;
  movingVehicles: number;
  stoppedVehicles: number;
  idleVehicles: number;
  activeAlerts: number;
  criticalAlerts: number;
  majorAlerts: number;
}

export type DeviceStatus = "Active" | "Provisioning" | "Inactive";

export interface RegisteredDevice {
  id: string;
  deviceId: string;
  vehicleReg: string;
  chassisNo: string;
  addedAt: string;
  status: DeviceStatus;
}

export type InsuranceStatus = "Active" | "Expiring" | "Expired";

export interface InsurancePolicy {
  id: string;
  vehicleId: string;
  vehicleReg: string;
  insurer: string;
  policyNo: string;
  type: "Comprehensive" | "Third-party only";
  idv: number;
  premium: number;
  expiryDate: string;
  status: InsuranceStatus;
}

export interface ScoreBreakdown {
  speed: number;
  braking: number;
  acceleration: number;
  cornering: number;
  idle: number;
}

export interface RiskEvents {
  overspeeding: number;
  harshBraking: number;
  harshAcceleration: number;
  sharpCornering: number;
  excessIdling: number;
}

export type DriverGrade = "A" | "B" | "C";

export interface DriverScorecard {
  driverId: string;
  driverName: string;
  vehicleReg: string;
  groupName: string;
  score: number;
  grade: DriverGrade;
  distance30Km: number;
  trips30: number;
  breakdown: ScoreBreakdown;
  riskEvents: RiskEvents;
}

export type MatchTone = "match" | "minor" | "review";

export interface FuelOdometerEntry {
  id: string;
  vehicleReg: string;
  date: string;
  prevOdo: number;
  odometerKm: number;
  fuelLitres: number;
  cost: number;
}

export interface PaymentMethod {
  id: string;
  type: "upi" | "card";
  label: string;
  detail: string;
  isPrimary: boolean;
}

export type InvoiceStatus = "Paid" | "Due" | "Overdue";

export interface Invoice {
  id: string;
  cycleLabel: string;
  amount: number;
  status: InvoiceStatus;
}

export interface UsageLedgerEntry {
  id: string;
  date: string;
  event: string;
  days: number;
  amount: number;
}
