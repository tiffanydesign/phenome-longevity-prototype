const p2 = (n: number) => String(n).padStart(2, "0");

/** 24 → "00:00:24" (list / detail) */
export function fmtDuration(sec: number): string {
  return `${p2(Math.floor(sec / 3600))}:${p2(Math.floor((sec % 3600) / 60))}:${p2(sec % 60)}`;
}

/** 6 → "00 : 00 : 06" (live form) */
export function fmtDurationSpaced(sec: number): string {
  return fmtDuration(sec).replace(/:/g, " : ");
}
