import "./Pager.css";

/** Page indicator: active = navy pill, others = pale dots (genetic_report, gut_report, genetic_conditions). */
export function Dots({ count, index, onPick }: { count: number; index: number; onPick?: (i: number) => void }) {
  return (
    <div className="rp-dots">
      {Array.from({ length: count }, (_, i) => (
        <button key={i} className="rp-dot" data-on={i === index || undefined} aria-label={`Page ${i + 1}`} onClick={() => onPick?.(i)} />
      ))}
    </div>
  );
}
