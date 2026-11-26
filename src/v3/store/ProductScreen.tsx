import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { findProduct, RING_GALLERY, type Gallery, type Product } from "@/data/store";
import { photo } from "@/lib/asset";
import { cart, cartCount, changeQty, lineQty } from "@/screens/store/cartStore";
import { Chevron } from "../ui/icons";
import { BlurLayers, V2Screen } from "../ui/shell";
import { hasScene } from "./StoreScreen";
import "./product.css";

/*
 * A product, in the clinical edition. The same content as the shared page
 * (gallery, kind, name, price, finish and size, the two-pack offer, the
 * description, quantity and add to bag), reordered by what a buyer reads:
 *
 *   1. the product itself, large, on the store's pale blue stage
 *   2. what it is and what it costs, as one block
 *   3. what must be chosen before buying (finish, size), only when needed
 *   4. why buy it (the offer, then the description)
 *   5. the action, always in reach at the foot
 */

const KIND: Record<string, string> = { Testing: "Test kit", Devices: "Device", Supplements: "Supplement" };
export const sek = (n: number) => `SEK ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ProductScreen() {
  const { id } = useParams();
  const p = findProduct(id);
  const [finish, setFinish] = useState<string>();
  const [size, setSize] = useState<string>();
  cart.use();
  if (!p) return <Navigate to="/v3/store" replace />;

  const needsFinish = !!p.finishes && !finish;
  const needsSize = !!p.sizes && !size;
  const valid = !needsFinish && !needsSize;
  const key = { productId: p.id, finish, size };
  const qty = valid ? lineQty(key) : 0;
  const g: Gallery | undefined = p.finishes ? (finish && RING_GALLERY[finish]) || RING_GALLERY.default : p.gallery;

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="pp scroll">
        <TopBar />
        <Stage p={p} g={g} />

        <section className="pp-head">
          <small>{KIND[p.category] ?? p.category}</small>
          <h1>{p.name}</h1>
          <p className="pp-price">{sek(p.price)}</p>
          {p.bundle && (
            <div className="pp-offer">
              <b>Buy 2, save 10%</b>
              <button onClick={() => changeQty(key, 2)}>Add 2</button>
            </div>
          )}
        </section>

        {p.finishes && <Finish p={p} value={finish} onChange={setFinish} />}
        {p.sizes && <Size sizes={p.sizes} value={size} onChange={setSize} />}

        {p.description && (
          <section className="pp-sec">
            <h2>About</h2>
            <p className="pp-desc">{p.description}</p>
          </section>
        )}
      </div>

      <Footer
        valid={valid}
        qty={qty}
        label={needsFinish ? "Choose a finish" : needsSize ? "Choose a size" : "Add to bag"}
        price={sek(p.price)}
        onAdd={() => changeQty(key, 1)}
        onLess={() => changeQty(key, -1)}
      />
    </V2Screen>
  );
}

/**
 * The action at the foot, in two states. Nothing in the bag yet: one wide
 * navy button carrying the price ("Add to bag · SEK 8,530.00"), or the
 * choice still missing. Once in the bag: the button splits into a pale
 * stepper holding the quantity and a navy "View bag" that goes to checkout.
 */
function Footer({ valid, qty, label, price, onAdd, onLess }: { valid: boolean; qty: number; label: string; price: string; onAdd: () => void; onLess: () => void }) {
  const nav = useNavigate();
  if (!valid || qty === 0) {
    return (
      <footer className="pp-foot">
        <button className="pp-cta pp-cta-wide" disabled={!valid} onClick={onAdd}>
          <span>{label}</span>
          {valid && <em>{price}</em>}
        </button>
      </footer>
    );
  }
  return (
    <footer className="pp-foot" data-in="">
      <div className="pp-stp" aria-label={`${qty} in your bag`}>
        <button aria-label="One fewer" onClick={onLess}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span>
          <b>{qty}</b>
        </span>
        <button aria-label="One more" onClick={onAdd}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <button className="pp-cta" onClick={() => nav("/store/cart")}>
        View bag
      </button>
    </footer>
  );
}

/** Back at the left, the bag at the right, both floating over the stage. */
function TopBar() {
  const nav = useNavigate();
  const n = cartCount(cart.use());
  return (
    <header className="pp-bar">
      <button className="pp-round" aria-label="Back" onClick={() => nav(-1)}>
        <Chevron dir="left" size={22} />
      </button>
      <button className="pp-bag" aria-label={n ? `Bag, ${n} items` : "Bag"} onClick={() => nav("/store/cart")}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5.5 8h13l-1 12.5h-11z" />
          <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
        </svg>
        {n > 0 && <span>{n > 99 ? "99+" : n}</span>}
      </button>
    </header>
  );
}

/** The pack large on the pale blue stage, then the thumbnails to page through. */
function Stage({ p, g }: { p: Product; g?: Gallery }) {
  const [page, setPage] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setPage(0);
    strip.current?.scrollTo({ left: 0 });
  }, [g]);
  const thumbs = g ? Array.from({ length: g.count }, (_, i) => g.thumbs[i % g.thumbs.length]) : [];
  const big = !g ? p.photo : page === 0 ? g.main : thumbs[page];
  return (
    <>
      <div className="pp-stage" data-scene={(!g && hasScene(p.photo)) || undefined}>
        <img key={big} src={photo(`store/${big}`)} alt={p.name} />
      </div>
      {g && (
        <div className="pp-thumbs scroll-x" ref={strip}>
          {thumbs.map((t, i) => (
            <button key={i} data-on={i === page || undefined} aria-label={`Image ${i + 1}`} onClick={() => setPage(i)}>
              <img src={photo(`store/${t}`)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/** Finish: swatches by group, the chosen name beside the heading; unavailable ones struck through. */
function Finish({ p, value, onChange }: { p: Product; value?: string; onChange: (v: string) => void }) {
  return (
    <section className="pp-sec">
      <h2>
        Finish <span>{value ?? "Choose one"}</span>
      </h2>
      {p.finishes?.map((grp) => (
        <div key={grp.group} className="pp-sw-group">
          <small>{grp.group}</small>
          <div className="pp-sw-row">
            {grp.swatches.map((s) => (
              <button
                key={s.name}
                className="pp-sw"
                aria-label={s.available ? s.name : `${s.name}, unavailable`}
                aria-pressed={s.name === value}
                disabled={!s.available}
                onClick={() => onChange(s.name)}
                style={{ "--sw": s.color } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** Size: one row of equal chips. */
function Size({ sizes, value, onChange }: { sizes: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <section className="pp-sec">
      <h2>
        Size <span>{value ?? "Choose one"}</span>
      </h2>
      <div className="pp-sizes">
        {sizes.map((s) => (
          <button key={s} aria-pressed={s === value} onClick={() => onChange(s)}>
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
