/**
 * A headline in two tones, read as one paragraph: the first sentence in ink,
 * what follows it in grey at the same size. The number that matters leads; the
 * reason for it carries on beside it rather than under a second heading.
 */
export function Say({ text, className }: { text: string; className?: string }) {
  const end = text.search(/[.!?](\s|$)/);
  const lead = end < 0 ? text : text.slice(0, end + 1);
  const rest = end < 0 ? "" : text.slice(end + 1).trim();
  return (
    <p className={`v2-say ${className ?? ""}`}>
      {lead}
      {rest && <span> {rest}</span>}
    </p>
  );
}
