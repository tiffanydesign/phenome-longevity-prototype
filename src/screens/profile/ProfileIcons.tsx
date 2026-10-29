import type { ReactNode } from "react";

/**
 * Profile-module glyphs. The app draws these with Material / Lucide icon fonts that are not
 * in public/assets/icons, so they are redrawn as inline SVG (currentColor) from the captures.
 */
function Svg({ size = 22, children, fill = false }: { size?: number; children: ReactNode; fill?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { size?: number };

export const IcHeart = ({ size }: P) => (
  <Svg size={size}>
    <path d="M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.7-8 10.6-8 10.6z" />
  </Svg>
);
export const IcDumbbell = ({ size }: P) => (
  <Svg size={size} fill>
    <path d="M2 10h2V8.5a1.5 1.5 0 0 1 3 0V11h10V8.5a1.5 1.5 0 0 1 3 0V10h2v4h-2v1.5a1.5 1.5 0 0 1-3 0V13H7v2.5a1.5 1.5 0 0 1-3 0V14H2z" />
  </Svg>
);
export const IcBox = ({ size }: P) => (
  <Svg size={size} fill>
    <path d="M2 6.5 6 5l6 2 6-2 4 1.5-1 3.5v8l-9 2-9-2v-8zM4.5 8l7.5 2.6L19.5 8l-.4-1.3L12 9 4.9 6.7z" />
  </Svg>
);
export const IcHistory = ({ size }: P) => (
  <Svg size={size}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3 3.5V8h4.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IcCheckCircle = ({ size }: P) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m8 12.3 2.7 2.7L16 9.6" />
  </Svg>
);
export const IcLock = ({ size }: P) => (
  <Svg size={size} fill>
    <path d="M7 10V7.5a5 5 0 0 1 10 0V10h.5A1.5 1.5 0 0 1 19 11.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20.5v-9A1.5 1.5 0 0 1 6.5 10zm2.4 0h5.2V7.5a2.6 2.6 0 0 0-5.2 0z" />
  </Svg>
);
export const IcPin = ({ size }: P) => (
  <Svg size={size} fill>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z" />
  </Svg>
);
export const IcHelp = ({ size }: P) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.3-2.5 3.6" />
    <path d="M12 17h.01" strokeWidth={2.6} />
  </Svg>
);
export const IcEye = ({ size }: P) => (
  <Svg size={size}>
    <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3.6" />
  </Svg>
);
export const IcEyeOff = ({ size }: P) => (
  <Svg size={size}>
    <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3.6" />
    <path d="M3 3l18 18" />
  </Svg>
);
export const IcPalette = ({ size }: P) => (
  <Svg size={size} fill>
    <path d="M12 2a10 10 0 0 0 0 20c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H17a5 5 0 0 0 5-5C22 6 17.5 2 12 2zM6.5 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </Svg>
);
export const IcGlobe = ({ size }: P) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
    <path d="M2.5 12h19M12 2.5c-3.2 3.4-3.2 15.6 0 19M12 2.5c3.2 3.4 3.2 15.6 0 19M4 7.5h16M4 16.5h16" stroke="var(--prf-globe-line, #e9ebf2)" strokeWidth={1.4} />
  </Svg>
);
export const IcPower = ({ size }: P) => (
  <Svg size={size}>
    <path d="M12 3v8" />
    <path d="M6.6 6.6a8 8 0 1 0 10.8 0" />
  </Svg>
);
export const IcArrowRight = ({ size = 20 }: P) => (
  <Svg size={size}>
    <path d="M4 12h15.5M13 5.5l6.5 6.5-6.5 6.5" />
  </Svg>
);
export const IcEdit = ({ size = 26 }: P) => (
  <Svg size={size}>
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    <path d="M18.4 2.6a2 2 0 0 1 3 3L12 15l-4 1 1-4z" />
  </Svg>
);
export const IcSave = ({ size = 26 }: P) => (
  <Svg size={size}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <circle cx="12" cy="14.5" r="1.6" fill="currentColor" />
    <path d="M7 3v4h7" />
  </Svg>
);
export const IcChevron = ({ size = 22, up = false }: P & { up?: boolean }) => (
  <Svg size={size}>
    <path d={up ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
  </Svg>
);
export const IcSearch = ({ size = 22 }: P) => (
  <Svg size={size}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Svg>
);
export const IcClose = ({ size = 22 }: P) => (
  <Svg size={size}>
    <path d="M5 5l14 14M19 5 5 19" />
  </Svg>
);
export const IcSun = ({ size = 24 }: P) => (
  <Svg size={size}>
    <path d="M12 2.5l2 2.8 3.3-.8.6 3.4 3.1 1.4-1.6 3 1.6 3-3.1 1.4-.6 3.4-3.3-.8-2 2.8-2-2.8-3.3.8-.6-3.4L3 15.3l1.6-3L3 9.3l3.1-1.4.6-3.4 3.3.8z" strokeWidth={1.6} />
    <circle cx="12" cy="12" r="3.3" strokeWidth={1.8} />
  </Svg>
);
export const IcMoon = ({ size = 24 }: P) => (
  <Svg size={size}>
    <path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A9 9 0 0 1 15.5 3.5z" strokeWidth={1.8} />
  </Svg>
);
export const IcCheck = ({ size = 14 }: P) => (
  <Svg size={size}>
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth={2.4} />
  </Svg>
);
export const IcTestTube = ({ size = 28 }: P) => (
  <Svg size={size} fill>
    <path d="M14.2 2.8a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1-1.4 1.4l-.7-.7-9.2 9.2a4.2 4.2 0 0 1-6-6l9.2-9.2-.7-.7a1 1 0 0 1 0-1.4zm1.4 3.5-4.9 4.9h4.6l2.6-2.6z" />
  </Svg>
);
