/** Where a device's readings can be seen in the app. No `to`: that page is not built yet. */
export interface Shows {
  label: string;
  to?: string;
}

/** A device the member has paired: worn on the body, or kept at home. */
export interface Device {
  id: string;
  name: string;
  /** short name for tight places (the Home widget) */
  short: string;
  /** wearables draw the app's own icon; home devices a line mark (devices/marks.tsx) */
  icon?: string;
  mark?: "scale" | "kitchen" | "bottle";
  battery: number;
  charging: boolean;
  /**
   * live: worn and syncing all day (a soft green dot);
   * standby: used now and then, so the last use is what matters (no dot)
   */
  link: "live" | "standby";
  /** the status line: when it last synced, or was last used */
  synced: string;
  /** what it measures, in a few words */
  reads: string;
  shows: Shows[];
  /** last sync as the detail page prints it */
  lastSync: string;
  /** roughly how long the battery lasts from here */
  left: string;
  /** product details, in the order the detail page lists them */
  spec: [string, string][];
}

/** Worn every day: the twin's continuous feed. Most recently synced first. */
export const PAIRED: Device[] = [
  {
    id: "ring",
    name: "Phenome Ring",
    short: "Ring",
    icon: "ring_icon",
    battery: 68,
    charging: false,
    link: "live",
    synced: "Synced 2 min ago",
    reads: "Heart, sleep, oxygen, temperature",
    lastSync: "16 Nov 2026, 10:44",
    left: "About 4 days left",
    spec: [
      ["Model number", "R01L"],
      ["Bluetooth", "07:32:00:11:3A:40"],
      ["Monitoring interval", "10 min"],
      ["Firmware", "2.4.1"],
      ["Material", "Ceramic"],
      ["Colour", "White"],
      ["Size", "US 8"],
    ],
    shows: [
      { label: "Sleep", to: "/v3/home?tab=sleep" },
      { label: "Heart", to: "/v3/home?tab=vitals" },
      { label: "Capacity", to: "/v3/metric/capacity" },
    ],
  },
  {
    id: "band",
    name: "Phenome Band",
    short: "Band",
    icon: "band_icon",
    battery: 41,
    charging: false,
    link: "live",
    synced: "Synced 14 min ago",
    reads: "Steps, activity, calories, blood pressure",
    lastSync: "16 Nov 2026, 10:32",
    left: "About 3 days left",
    spec: [
      ["Model number", "H59_V2.0"],
      ["Bluetooth", "31:39:47:32:7A:04"],
      ["Monitoring interval", "10 min"],
      ["Firmware", "1.8.0"],
      ["Strap", "Silicone, black"],
    ],
    shows: [
      { label: "Activity", to: "/v3/home?tab=activity" },
      { label: "Blood pressure", to: "/v3/metric/bpd" },
    ],
  },
];

/**
 * Kept at home and used now and then: they log for the member when used, and
 * never go with them, so Home's header leaves them out.
 */
export const HOME_DEVICES: Device[] = [
  { id: "scale", name: "Body scale", short: "Scale", mark: "scale", battery: 82, charging: false, link: "standby", synced: "Weighed today, 07:12", reads: "Weight, body fat, muscle", shows: [{ label: "Weight trend" }], lastSync: "16 Nov 2026, 07:12", left: "About 5 months left", spec: [["Model number", "S20-BIA"], ["Bluetooth", "5C:02:72:A1:0E:93"], ["Firmware", "3.1.0"], ["Measures", "8-point impedance"], ["Users", "Up to 8"]] },
  { id: "kitchen", name: "Kitchen scale", short: "Kitchen", mark: "kitchen", battery: 55, charging: false, link: "standby", synced: "Used yesterday, 19:40", reads: "Portion weight for meals you log", shows: [{ label: "Food log", to: "/v3/metric/diet" }], lastSync: "15 Nov 2026, 19:40", left: "About 3 months left", spec: [["Model number", "K5"], ["Bluetooth", "A4:C1:38:5F:22:D0"], ["Firmware", "1.2.3"], ["Range", "1 g – 5 kg"]] },
  { id: "bottle", name: "Smart bottle", short: "Bottle", mark: "bottle", battery: 16, charging: false, link: "standby", synced: "Synced 1 h ago", reads: "Water drunk through the day", shows: [{ label: "Water habit", to: "/v3/habits" }], lastSync: "16 Nov 2026, 09:51", left: "About 1 day left", spec: [["Model number", "B2-500"], ["Bluetooth", "F0:08:D1:6C:4B:17"], ["Firmware", "2.0.5"], ["Capacity", "500 ml"], ["Material", "Stainless steel"]] },
];

export const ALL_DEVICES: Device[] = [...PAIRED, ...HOME_DEVICES];

export const deviceById = (id: string) => ALL_DEVICES.find((d) => d.id === id);

/** A battery the member should act on soon. */
export const isLow = (d: Device) => d.battery <= 20 && !d.charging;

/** The device that synced last: the one Home's header reports on. Wearables only. */
export const LATEST_DEVICE = PAIRED[0];
