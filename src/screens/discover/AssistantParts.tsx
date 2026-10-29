import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import { asset } from "@/lib/asset";
import type { AnswerBlock } from "@/data/discoverAssistant";

/** "**PEX5 Gene**: …" → bold run + text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/**
 * Navy answer bubble, white text (capture assistant/answer_top).
 * TODO(fidelity): answer_top shows the bubble clipped after "2. SRP54 Gene: This gene is linked to"
 * (mid-layout capture artefact?); we render the full bubble.
 */
export function AnswerBubble({ blocks }: { blocks: AnswerBlock[] }) {
  return (
    <div className="as-ai">
      {blocks.map((b, i) =>
        "p" in b ? (
          <p key={i}>
            <Rich text={b.p} />
          </p>
        ) : (
          <ol key={i}>
            {b.ol.map((li, j) => (
              <li key={j}>
                <Rich text={li} />
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}

/** Wireframe globe behind the suggestion chips — the APK's own Lottie (assets/lottie/globe.json). */
export function Globe3D() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: asset("lottie/globe.json"),
    });
    return () => anim.destroy();
  }, []);
  return <div className="as-globe" ref={ref} aria-hidden />;
}
