/** Small line icons used across the journal screens (Material-style glyphs drawn by the Flutter app). */

const s = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const });

export function CloseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDown({ size = 20 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarOutline({ size = 22 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path
        d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2.2" />
      <path d="M14.5 14.5L20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path d="M9 4h6l1.6 2H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.4z" fill="currentColor" />
      <circle cx="12" cy="13" r="3.6" fill="#000" />
      <circle cx="12" cy="13" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function TrashIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path d="M9 3.5h6M4.5 6h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 6.5V20a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function EditIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.6 3.4a2 2 0 0 1 2.9 2.9L12 14.8 8.5 15.5l.7-3.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <path d="M4 12h16m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MinusCircle({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8.5 14h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function PlusCircleThick({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M14 8.5v11M8.5 14h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircle({ size = 24, checked }: { size?: number; checked: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.6" />
      {checked && <path d="M7.5 12.3l3 3 6-6.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function VideoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...s(size)}>
      <rect x="2.5" y="6" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 10.5L21 7v10l-5.5-3.5z" fill="currentColor" />
    </svg>
  );
}
