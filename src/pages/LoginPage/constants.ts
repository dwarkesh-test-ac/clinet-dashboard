import type { Icon } from "@phosphor-icons/react";
import { BellRinging, MapTrifold, Truck } from "@phosphor-icons/react";

export interface TutorialSlide {
  icon: Icon;
  title: string;
  desc: string;
}

export const TUT: TutorialSlide[] = [
  {
    icon: MapTrifold,
    title: "Track your fleet live",
    desc: "Every vehicle appears on the live map within seconds of ignition. Tap any pin for speed, driver and trip details in real time.",
  },
  {
    icon: Truck,
    title: "Vehicles & drivers in one place",
    desc: "Register devices, assign drivers and watch distance, trips and driving scores roll up automatically — no spreadsheets.",
  },
  {
    icon: BellRinging,
    title: "Alerts that find you",
    desc: "Overspeed, geofence and ignition alerts reach you on WhatsApp and SMS the moment they happen. Upgrade anytime for the full toolkit.",
  },
];
