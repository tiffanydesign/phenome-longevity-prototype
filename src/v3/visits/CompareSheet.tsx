import { visitDate, VISITS } from "../study/data";

/**
 * Choosing the span, from the bottom: the two common spans first, then each end
 * picked from the list of visits. The end being set is chosen at the top; a visit
 * that would cross the other end swaps them, so any two visits can be compared.
 */
export function CompareSheet({
  end,
  pair,
  clinicOf,
  onEnd,
  onPick,
  onClose,
}: {
  end: "from" | "to";
  pair: [number, number];
  clinicOf: (i: number) => string;
  onEnd: (e: "from" | "to") => void;
  onPick: (p: [number, number]) => void;
  onClose: () => void;
}) {
  const last = VISITS.length - 1;
  const [a, b] = pair;
  const set = (x: number, y: number) => {
    if (x === y) return;
    onPick(x < y ? [x, y] : [y, x]);
  };
  const choose = (i: number) => {
    if (end === "from") set(i, b);
    else set(a, i);
    onClose();
  };
  const QUICK: { label: string; p: [number, number] }[] = [
    { label: "Last two visits", p: [last - 1, last] },
    { label: "First to latest", p: [0, last] },
  ];

  return (
    <div className="vc-scrim" onClick={onClose}>
      <div className="vc-sheet" role="dialog" aria-label="Choose visits to compare" onClick={(e) => e.stopPropagation()}>
        <i className="vc-grab" aria-hidden />
        <div className="vc-quick">
          {QUICK.map((q) => (
            <button
              key={q.label}
              aria-pressed={q.p[0] === a && q.p[1] === b}
              onClick={() => {
                onPick(q.p);
                onClose();
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="vc-ends" role="tablist" aria-label="End to set">
          {(["from", "to"] as const).map((e) => (
            <button key={e} role="tab" aria-selected={end === e} onClick={() => onEnd(e)}>
              <small>{e === "from" ? "From" : "To"}</small>
              <b>{visitDate(VISITS[e === "from" ? a : b])}</b>
            </button>
          ))}
        </div>

        <ul className="vc-visits">
          {[...VISITS.keys()].reverse().map((i) => {
            const mine = end === "from" ? a : b;
            const other = end === "from" ? b : a;
            return (
              <li key={i}>
                <button aria-pressed={i === mine} disabled={i === other} onClick={() => choose(i)}>
                  <span>
                    <b>{visitDate(VISITS[i])}</b>
                    <small>
                      Visit {i + 1} · {clinicOf(i)}
                      {i === last ? " · Latest" : ""}
                    </small>
                  </span>
                  {i === other ? <em>{end === "from" ? "To" : "From"}</em> : <i className="vc-radio" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
