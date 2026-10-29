import { NavHeader } from "@/components/NavHeader";
import { PdfPill } from "./PdfFlow";
import { greeting } from "./RIcon";
import "./ReportHeader.css";

/**
 * Greeting header of every report hub ("Good afternoon, Tiffany / <title>  [Generate PDF]").
 * The captured type is a little smaller than the shared NavHeader greeting defaults, so the
 * strings are wrapped in module-local spans that override size/weight.
 */
export function ReportHeader({ title, onPdf, fileIcon = false }: { title: string; onPdf: () => void; fileIcon?: boolean }) {
  return (
    <NavHeader
      variant="greeting"
      eyebrow={<span className="rh-eyebrow">{greeting()}, Tiffany</span>}
      title={<span className="rh-title">{title}</span>}
      right={<PdfPill file={fileIcon} onClick={onPdf} />}
    />
  );
}
