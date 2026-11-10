/** The member's paired wearables, most recently synced first. */
export const PAIRED = [
  { name: "Phenome Ring", icon: "ring_icon", battery: 68, charging: false, synced: "Synced 2 min ago", reads: "Heart, sleep, oxygen, temperature" },
  { name: "Phenome Band", icon: "band_icon", battery: 41, charging: false, synced: "Synced 14 min ago", reads: "Steps, activity, calories, blood pressure" },
];

/** The device that synced last: the one Home's header reports on. */
export const LATEST_DEVICE = PAIRED[0];
