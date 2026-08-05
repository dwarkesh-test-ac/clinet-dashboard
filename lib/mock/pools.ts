export interface CityCenter {
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: CityCenter[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Navi Mumbai", lat: 19.033, lng: 73.0297 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Noida", lat: 28.5355, lng: 77.391 },
  { name: "Ghaziabad", lat: 28.6692, lng: 77.4538 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
];

export const RTO_CODES = ["DL", "MH", "UP", "HR", "GJ", "RJ", "KA", "TN", "WB", "PB"];

export const FIRST_NAMES = [
  "Rahul",
  "Amit",
  "Vikas",
  "Sunil",
  "Mahesh",
  "Pawan",
  "Rajesh",
  "Sanjay",
  "Deepak",
  "Manoj",
  "Anil",
  "Ashok",
  "Ravi",
  "Suresh",
  "Vijay",
  "Naveen",
  "Ajay",
  "Kiran",
  "Prakash",
  "Yogesh",
  "Priya",
  "Neha",
  "Pooja",
  "Sunita",
  "Anita",
  "Kavita",
];

export const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Yadav",
  "Kumar",
  "Patel",
  "Singh",
  "Gupta",
  "Reddy",
  "Nair",
  "Iyer",
  "Mishra",
  "Chauhan",
  "Rao",
  "Joshi",
  "Malhotra",
  "Kapoor",
  "Bhatt",
  "Desai",
];

export const GROUP_NAMES = [
  { name: "Mumbai Distribution", description: "Local delivery fleet covering Mumbai & Thane" },
  { name: "Delhi NCR Long Haul", description: "Inter-city freight across the NCR corridor" },
  { name: "Cold Chain Fleet", description: "Refrigerated vehicles for perishables" },
  { name: "Express Parcel", description: "Time-critical parcel & courier routes" },
  { name: "Last Mile Bikes", description: "Two-wheeler fleet for last-mile delivery" },
  { name: "Bengaluru Ops", description: "South zone regional distribution" },
];

export const COMPANY_NAME = "Shastri Logistics Pvt. Ltd.";

export function regNumber(rand: () => number): string {
  const code = RTO_CODES[Math.floor(rand() * RTO_CODES.length)];
  const zone = String(Math.floor(rand() * 60) + 1).padStart(2, "0");
  const letters =
    String.fromCharCode(65 + Math.floor(rand() * 26)) +
    String.fromCharCode(65 + Math.floor(rand() * 26));
  const num = String(Math.floor(rand() * 9000) + 1000);
  return `${code} ${zone} ${letters} ${num}`;
}

export function fullName(rand: () => number): string {
  const f = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const l = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
  return `${f} ${l}`;
}
