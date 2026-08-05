import type { AuthView, FlowState, OtpFrom } from "./types";

export interface Destination {
  key: string;
  label: string;
  lat: number;
  lng: number;
}

// Every distinct screen of the create-account journey gets its own real-world destination —
// including both branches of the Individual/Organization choice — spread far enough apart
// (mostly 60-120° of longitude) that flying between any two of them is a genuinely dramatic
// spin, not a small nudge. None of these city names are shown in the UI (only the narrative
// `label` is), so this is purely an animation choice. Keyed by exact screen identity (not a
// step count) so navigating back to an already-visited screen resolves to the same
// destination it had before — that's what makes going back read as a return trip.
const DESTINATIONS: Record<string, Omit<Destination, "key">> = {
  "signup-type": { label: "Registering fleet HQ", lat: 28.6139, lng: 77.209 }, // Delhi
  "signup-individual": { label: "Setting up your account", lat: 51.5074, lng: -0.1278 }, // London
  "signup-organization": { label: "Setting up your organization", lat: 48.8566, lng: 2.3522 }, // Paris
  otp: { label: "Identity verified", lat: 35.6762, lng: 139.6503 }, // Tokyo
  "tutorial-0": { label: "Track your fleet live", lat: 40.7128, lng: -74.006 }, // New York
  "tutorial-1": { label: "Vehicles & drivers in one place", lat: 25.2048, lng: 55.2708 }, // Dubai
  "tutorial-2": { label: "Alerts that find you", lat: 1.3521, lng: 103.8198 }, // Singapore
  choosePlan: { label: "Plan configured", lat: -33.8688, lng: 151.2093 }, // Sydney
  payment: { label: "Billing activated", lat: -33.9249, lng: 18.4241 }, // Cape Town
  firstDevice: { label: "First vehicle online", lat: -23.5505, lng: -46.6333 }, // Sao Paulo
  complete: { label: "Fleet network live", lat: 19.076, lng: 72.8777 }, // Mumbai
};

const FALLBACK_KEY = "signup-type";

export function getDestination(
  state: Pick<FlowState, "authView" | "signupStep" | "acctType" | "tutStep">,
): Destination {
  let key: string;
  switch (state.authView) {
    case "signup":
      key = state.signupStep === "type" ? "signup-type" : `signup-${state.acctType}`;
      break;
    case "otp":
      key = "otp";
      break;
    case "tutorial":
      key = `tutorial-${state.tutStep}`;
      break;
    case "choosePlan":
    case "payment":
    case "firstDevice":
    case "complete":
      key = state.authView;
      break;
    default:
      key = FALLBACK_KEY;
  }
  const dest = DESTINATIONS[key] ?? DESTINATIONS[FALLBACK_KEY]!;
  return { key, ...dest };
}

// Pool of real-world coordinates (mostly Indian hubs, a few major global logistics
// cities) for the ambient "random markers dropping" ripple effect — keeps drops landing
// on plausible locations instead of literally-uniform-random (which mostly lands in ocean).
export const AMBIENT_CITIES: Array<{ lat: number; lng: number }> = [
  { lat: 28.6139, lng: 77.209 }, // Delhi
  { lat: 19.076, lng: 72.8777 }, // Mumbai
  { lat: 12.9716, lng: 77.5946 }, // Bengaluru
  { lat: 13.0827, lng: 80.2707 }, // Chennai
  { lat: 22.5726, lng: 88.3639 }, // Kolkata
  { lat: 17.385, lng: 78.4867 }, // Hyderabad
  { lat: 18.5204, lng: 73.8567 }, // Pune
  { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
  { lat: 26.9124, lng: 75.7873 }, // Jaipur
  { lat: 21.1702, lng: 72.8311 }, // Surat
  { lat: 26.8467, lng: 80.9462 }, // Lucknow
  { lat: 22.7196, lng: 75.8577 }, // Indore
  { lat: 30.7333, lng: 76.7794 }, // Chandigarh
  { lat: 9.9312, lng: 76.2673 }, // Kochi
  { lat: 20.2961, lng: 85.8245 }, // Bhubaneswar
  { lat: 25.5941, lng: 85.1376 }, // Patna
  { lat: 1.3521, lng: 103.8198 }, // Singapore
  { lat: 25.2048, lng: 55.2708 }, // Dubai
  { lat: 51.5074, lng: -0.1278 }, // London
  { lat: 1.2921, lng: 36.8219 }, // Nairobi
];

// Plain sign-in also routes through authView "otp" (otpFrom "signin") for its demo 2FA
// step — that must stay on the regular PromoPanel scene, only the create-account journey
// (and its own otp sub-step) gets the globe takeover.
export function isJourneyView(authView: AuthView, otpFrom: OtpFrom): boolean {
  return (
    authView === "signup" ||
    authView === "tutorial" ||
    authView === "choosePlan" ||
    authView === "payment" ||
    authView === "firstDevice" ||
    authView === "complete" ||
    (authView === "otp" && otpFrom === "signup")
  );
}
