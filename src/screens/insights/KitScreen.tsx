import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { photo } from "@/lib/asset";
import { useDataset } from "@/lib/data";
import { KITS, kitStatus } from "@/data/insights";
import { ArchiveBox, ArrowBack, ArrowRight, Chevron } from "./icons";
import "./Kit.css";

/**
 * Test-kit landing page — capture: insights_genome/top, carousel_2…4, insights_oral/top,
 * insights_gut/top, insights_transcriptome/top. Route /insights/kit/:kind.
 */
export function KitScreen({ kind: kindProp }: { kind?: string }) {
  const params = useParams();
  const kind = kindProp ?? params.kind ?? "genome";
  const slides = KITS[kind] ?? KITS.genome;
  const status = useDataset(kitStatus);
  // Prototype deep-link for tests/compare: ?slide=N (1-based).
  const [i, setI] = useState(() => Math.max(0, Number(new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("slide") ?? 1) - 1));
  const nav = useNavigate();
  const touchX = useRef<number | null>(null);
  const multi = slides.length > 1;
  const go = (n: number) => setI(Math.max(0, Math.min(slides.length - 1, n)));
  const slide = slides[i];

  return (
    <Screen
      header={
        <header className="kit-head">
          <button className="kit-back" aria-label="Back" onClick={() => nav(-1)}>
            <ArrowBack size={28} />
          </button>
        </header>
      }
    >
      <div className="kit">
        <h1 className="kit-title">{slide.title}</h1>

        <div
          className="kit-carousel"
          onPointerDown={(e) => (touchX.current = e.clientX)}
          onPointerUp={(e) => {
            if (touchX.current == null) return;
            const dx = e.clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
          }}
        >
          <div className="kit-track" style={{ transform: `translateX(${-i * 100}%)` }}>
            {slides.map((s) => (
              <div key={s.title} className="kit-slide">
                {s.image ? (
                  // Network image in the app — cropped 1:1 from the captures (incl. its drop shadow).
                  <img className="kit-box" src={photo(`insights/${s.image}`)} alt={s.title} draggable={false} />
                ) : (
                  // Transcriptome has no kit image: Flutter's grey placeholder circle (capture insights_transcriptome/top).
                  <span className="kit-placeholder">
                    <ArchiveBox size={66} />
                  </span>
                )}
              </div>
            ))}
          </div>
          {multi && i > 0 && (
            <button className="kit-chev kit-chev-l" aria-label="Previous" onClick={() => go(i - 1)}>
              <Chevron size={30} dir="left" />
            </button>
          )}
          {multi && i < slides.length - 1 && (
            <button className="kit-chev kit-chev-r" aria-label="Next" onClick={() => go(i + 1)}>
              <Chevron size={30} />
            </button>
          )}
        </div>

        {multi && (
          <div className="kit-dots">
            {slides.map((s, n) => (
              <button key={s.title} className="kit-dot" data-on={n === i || undefined} aria-label={s.title} onClick={() => go(n)} />
            ))}
          </div>
        )}

        <div className="kit-card" data-dots={multi || undefined}>
          <div className="kit-visit">
            <span>Visit</span>
            <b>{status.visit}</b>
          </div>
          <div className="kit-status">
            <span>Status</span>
            <span className="kit-pill">{status.status}</span>
          </div>
          <div className="kit-msg">{status.message}</div>
        </div>

        <button className="kit-cta" onClick={() => nav(slide.report)}>
          View Report <ArrowRight size={22} />
        </button>
      </div>
    </Screen>
  );
}
