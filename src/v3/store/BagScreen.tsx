import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { photo } from "@/lib/asset";
import { SHIPPING } from "@/data/store";
import { cart, cartCount, changeQty, lineProduct, seedFromQuery, type CartLine } from "@/screens/store/cartStore";
import { Chevron } from "../ui/icons";
import { BlurLayers, useGo, V2Screen } from "../ui/shell";
import { sek } from "./ProductScreen";
import { hasScene } from "./StoreScreen";
import "./bag.css";

/*
 * The bag, in the clinical edition. Read top to bottom as a buyer asks:
 *
 *   1. what is in it            one card, a row per item with its own stepper
 *   2. can I pay less           the discount code, one quiet row
 *   3. what will it cost        subtotal and shipping, then the total, largest
 *   4. what next                one button at the foot carrying the total
 */

const KIND: Record<string, string> = { Testing: "Test kit", Devices: "Device", Supplements: "Supplement" };

export function BagScreen() {
  const { search } = useLocation();
  const nav = useNavigate();
  const go = useGo();
  // prototype hook: ?seed=ring fills the bag, ?seed=empty clears it
  useMemo(() => seedFromQuery(search), [search]);
  const lines = cart.use();
  const [scrolled, setScrolled] = useState(false);
  const [code, setCode] = useState(() => new URLSearchParams(search).get("code") ?? "");
  const [codeError, setCodeError] = useState(false);

  const subtotal = lines.reduce((s, l) => s + lineProduct(l).price * l.qty, 0);
  const total = subtotal + SHIPPING;
  const count = cartCount(lines);
  const empty = lines.length === 0;

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="bg scroll" data-empty={empty || undefined} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 48)}>
        <header className="bg-bar" data-scrolled={scrolled || undefined}>
          <button className="bg-round" aria-label="Back" onClick={() => nav(-1)}>
            <Chevron dir="left" size={22} />
          </button>
          <span className="bg-bar-title">Bag</span>
          <span aria-hidden />
        </header>

        <section className="bg-hero">
          <h1>Bag</h1>
          {!empty && (
            <p>
              {count} {count === 1 ? "item" : "items"}
            </p>
          )}
        </section>

        {empty ? (
          <div className="bg-empty">
            <span className="bg-empty-mark" aria-hidden>
              <BagGlyph size={30} />
            </span>
            <h2>Your bag is empty</h2>
            <p>Tests, devices and supplements you add from the store show here.</p>
            <button className="bg-ghost" onClick={(e) => go("/v3/store", { from: e.currentTarget })}>
              Browse the store
            </button>
          </div>
        ) : (
          <>
            {/* 1 */}
            <ul className="bg-list">
              {lines.map((l) => (
                <Line key={`${l.productId}|${l.finish}|${l.size}`} l={l} />
              ))}
            </ul>

            {/* 2 */}
            <section className="bg-code" data-error={codeError || undefined}>
              <label>
                <span className="bg-code-mark" aria-hidden>
                  <TagGlyph />
                </span>
                <input
                  value={code}
                  placeholder="Discount code"
                  aria-label="Discount code"
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError(false);
                  }}
                />
              </label>
              {/* every code is rejected: no coupon is active on this account */}
              <button disabled={!code.trim()} onClick={() => setCodeError(true)}>
                Apply
              </button>
            </section>
            {codeError && <p className="bg-code-err">This code isn't active. Check it and try again.</p>}

            {/* 3 */}
            <section className="bg-sum" aria-label="Order summary">
              <Row label="Subtotal">{sek(subtotal)}</Row>
              <Row label="Shipping">{sek(SHIPPING)}</Row>
              <div className="bg-sum-total">
                <span>Total</span>
                <b>{sek(total)}</b>
              </div>
            </section>
          </>
        )}
      </div>

      {/* 4 */}
      {!empty && (
        <footer className="bg-foot">
          <button className="bg-cta" onClick={() => nav("/store/checkout")}>
            <span>Checkout</span>
            <em>{sek(total)}</em>
          </button>
        </footer>
      )}
    </V2Screen>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-sum-row">
      <span>{label}</span>
      <b>{children}</b>
    </div>
  );
}

/** One item: the photo in its well, name and choices, then quantity and line price on one baseline. */
function Line({ l }: { l: CartLine }) {
  const p = lineProduct(l);
  const go = useGo();
  const variant = [l.finish, l.size && `Size ${l.size}`].filter(Boolean).join(" · ");
  const thumb = p.id === "phenometech-ring" && l.finish === "Metal Black" ? "cart-ring-metal-black.jpg" : p.photo;
  return (
    <li className="bg-line">
      <button className="bg-thumb" data-scene={(thumb !== "cart-ring-metal-black.jpg" && hasScene(thumb)) || undefined} aria-label={p.name} onClick={(e) => go(`/store/product/${p.id}`, { from: e.currentTarget })}>
        <img src={photo(`store/${thumb}`)} alt="" />
      </button>
      <div className="bg-line-t">
        <small>{KIND[p.category] ?? p.category}</small>
        <b>{p.name}</b>
        {variant && <span>{variant}</span>}
        <div className="bg-line-foot">
          <div className="bg-stp" aria-label={`Quantity ${l.qty}`}>
            <button aria-label={l.qty === 1 ? `Remove ${p.name}` : "One fewer"} onClick={() => changeQty(l, -1)}>
              {l.qty === 1 ? <BinGlyph /> : <Minus />}
            </button>
            <output>{l.qty}</output>
            <button aria-label="One more" onClick={() => changeQty(l, 1)}>
              <Plus />
            </button>
          </div>
          <b className="bg-line-price">{sek(p.price * l.qty)}</b>
        </div>
      </div>
    </li>
  );
}

export function BagGlyph({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5.5 8h13l-1 12.5h-11z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </svg>
  );
}

function TagGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  );
}

function Minus() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BinGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7M9 7V4.5h6V7" />
    </svg>
  );
}
