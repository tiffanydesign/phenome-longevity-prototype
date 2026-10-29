import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { photo } from "@/lib/asset";
import type { Gallery, Product } from "@/data/store";
import { cart, cartCount } from "./cartStore";

/** Bag icon top-right with red count badge (capture product_device/added_to_cart). */
export function CartButton() {
  const nav = useNavigate();
  const n = cartCount(cart.use());
  return (
    <button className="pd-cart" aria-label="Cart" onClick={() => nav("/store/cart")}>
      <Icon name="cart" size={22} />
      {n > 0 && <span className="pd-badge">{n}</span>}
    </button>
  );
}

/**
 * Image carousel (394 × 280) + dot row + thumbnail strip (60 × 60, pitch 68).
 * Only the first page and the visible thumbnails were captured.
 */
export function ProductGallery({ g }: { g: Gallery }) {
  const [page, setPage] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setPage(0);
    strip.current?.scrollTo({ left: 0 });
  }, [g]);
  // TODO(fidelity): pages beyond the first image were not captured — later pages reuse the thumbnails.
  const thumbs = Array.from({ length: g.count }, (_, i) => g.thumbs[i % g.thumbs.length]);
  const big = page === 0 ? g.main : thumbs[page];

  // dots: 8 px, pitch 12, active 19.7 wide; scaled down to fit 358 px (41 dots on the ring)
  const natural = (g.count - 1) * 12 + 19.7;
  const k = Math.min(1, 358 / natural);
  return (
    <>
      <div className="pd-hero">
        <img src={photo(`store/${big}`)} alt="" />
        <div className="pd-dots" style={{ gap: 4 * k }}>
          {thumbs.map((_, i) => (
            <span key={i} className="pd-dot" data-on={i === page || undefined} style={{ width: (i === page ? 19.7 : 8) * k, height: 8 * k }} />
          ))}
        </div>
      </div>
      <div className="pd-thumbs scroll-x" ref={strip}>
        {thumbs.map((t, i) => (
          <button key={i} className="pd-thumb" data-on={i === page || undefined} onClick={() => setPage(i)}>
            <img src={photo(`store/${t}`)} alt="" />
          </button>
        ))}
      </div>
    </>
  );
}

/** Finish groups — unavailable swatches are dimmed and non-clickable (note on product_device/size_selected). */
export function FinishPicker({ p, value, onChange }: { p: Product; value?: string; onChange: (v: string) => void }) {
  return (
    <section className="pd-opt">
      <h3 className="pd-opt-h">
        Finish{value && <span className="pd-opt-val">{value}</span>}
      </h3>
      {p.finishes?.map((grp) => (
        <div key={grp.group} className="pd-sw-group">
          <span className="pd-sw-label">{grp.group}</span>
          <div className="pd-sw-row">
            {grp.swatches.map((s) => (
              <button
                key={s.name}
                className="pd-sw"
                aria-label={s.name}
                disabled={!s.available}
                data-on={s.name === value || undefined}
                onClick={() => onChange(s.name)}
              >
                <span className="pd-sw-dot" style={{ background: s.color }} />
                <span className="pd-sr">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function SizePicker({ sizes, value, onChange }: { sizes: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <section className="pd-opt pd-sizes">
      <h3 className="pd-opt-h">
        Size{value && <span className="pd-opt-val">{value}</span>}
      </h3>
      <div className="pd-size-grid">
        {sizes.map((s) => (
          <button key={s} className="pd-size" data-on={s === value || undefined} onClick={() => onChange(s)}>
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Footer: − n + stepper (44 px circles at x 20 / 112) and the CTA (x 172–374, h 54). */
export function ProductFooter({
  qty,
  enabled,
  cta,
  onMinus,
  onPlus,
  onCta,
}: {
  qty: number;
  enabled: boolean;
  cta: string;
  onMinus: () => void;
  onPlus: () => void;
  onCta: () => void;
}) {
  return (
    <div className="pd-foot">
      <div className="pd-stp" data-off={!enabled || undefined}>
        <button className="pd-stp-btn" aria-label="Decrease" disabled={!enabled} onClick={onMinus}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <span className="pd-stp-val">{qty}</span>
        <button className="pd-stp-btn" aria-label="Increase" disabled={!enabled} onClick={onPlus}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      <button className="pd-cta" disabled={!enabled} onClick={onCta}>
        {cta}
      </button>
    </div>
  );
}
