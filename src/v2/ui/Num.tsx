/** New Science Mono gives punctuation a full cell; pull it in so 7:24 reads as one value. */
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
