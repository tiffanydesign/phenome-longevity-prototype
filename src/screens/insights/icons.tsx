/** Module-local inline icons (Material-style glyphs redrawn from the insights captures). */

type P = { size?: number };

export function Chevron({ size = 24, dir = "right" }: P & { dir?: "left" | "right" | "up" }) {
  const d = dir === "right" ? "M9 5l7 7-7 7" : dir === "left" ? "M15 5l-7 7 7 7" : "M5 15l7-7 7 7";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ size = 22 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12h15m0 0l-6.5-6.5M19 12l-6.5 6.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowBack({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20.5 12H4m0 0l7-7m-7 7l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Refresh({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12a7 7 0 1 1-2.05-4.95" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19.6 3.6v5.2h-5.2z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Folder({ size = 24, filled = false }: P & { filled?: boolean }) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h5.6l2 2h9.4A1.5 1.5 0 0 1 22 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5z" fill="currentColor" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 6.2c0-.7.5-1.2 1.2-1.2h4.6l1.8 2h9.2c.7 0 1.2.5 1.2 1.2v9.6c0 .7-.5 1.2-1.2 1.2H4.2C3.5 19 3 18.5 3 17.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Material "picture_as_pdf" (outlined) — reports list rows. */
export function PdfStack({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6v14h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="7.5" y="2.5" width="14" height="14" rx="1.2" stroke="currentColor" strokeWidth="1.9" />
      <text x="14.5" y="12.3" textAnchor="middle" fontSize="5.6" fontWeight="700" fill="currentColor" fontFamily="Arial">PDF</text>
    </svg>
  );
}

/** Page-with-"PDF" glyph (Upload Lab Report button, PDF viewer page pill). */
export function PdfFile({ size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13.5 2H6.2C5.5 2 5 2.5 5 3.2v10.3M13.5 2L19 7.5M13.5 2v5.5H19m0 0v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M5 16.5v4.3c0 .7.5 1.2 1.2 1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <text x="15" y="21.6" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="Arial">PDF</text>
    </svg>
  );
}

export function Clock({ size = 14 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Pencil({ size = 15 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20h3.6L18.4 9.2 14.8 5.6 4 16.4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.2 7.2l3.6 3.6M16.6 3.8l1.4-1.4a1.2 1.2 0 0 1 1.7 0l1.9 1.9a1.2 1.2 0 0 1 0 1.7l-1.4 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** Material "assignment" filled clipboard — offline/clinical empty state. */
export function Clipboard({ size = 56 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M12 1.6a2 2 0 0 1 1.9 1.4H17a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.1A2 2 0 0 1 12 1.6zm0 1.4a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6zM8.3 10.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8zm0 3.9a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8zM10.6 10.4a.7.7 0 0 0 0 1.4h5.2a.7.7 0 0 0 0-1.4zm0 3.9a.7.7 0 0 0 0 1.4h5.2a.7.7 0 0 0 0-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Material "inventory_2" outlined — transcriptome kit placeholder. */
export function ArchiveBox({ size = 66 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.8" y="3" width="18.4" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 8v11.6c0 .5.4.9.9.9h14.2c.5 0 .9-.4.9-.9V8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 11.8h4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ListIcon({ size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="4" cy="5.5" r="1.7" />
      <circle cx="4" cy="12" r="1.7" />
      <circle cx="4" cy="18.5" r="1.7" />
      <rect x="8" y="4.2" width="14" height="2.6" rx="1.3" />
      <rect x="8" y="10.7" width="14" height="2.6" rx="1.3" />
      <rect x="8" y="17.2" width="14" height="2.6" rx="1.3" />
    </svg>
  );
}
