/** Punctuation wrapped apart from the digits, so a face that sets it wide can pull it in (`.v2-p`). */
export function Num({ v }: { v: string }) {
  const parts = v.match(/[.,:]|[^.,:]+/g) ?? [];
  return (
    <>
      {parts.map((p, i) =>
        /[.,:]/.test(p) ? (
          <i key={i} className="v2-p">
            {p}
          </i>
        ) : (
          p
        ),
      )}
    </>
  );
}
