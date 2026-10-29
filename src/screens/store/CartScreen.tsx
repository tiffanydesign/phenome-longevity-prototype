import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { Icon } from "@/components/Icon";
import { photo } from "@/lib/asset";
import { kr, krs, SHIPPING } from "@/data/store";
import { cart, cartCount, changeQty, lineProduct, type CartLine } from "./cartStore";
import { CheckoutSheet } from "./CheckoutSheet";
import "./CartScreen.css";

/**
 * Your Cart — capture: cart/top, cart/discount_invalid, cart/empty.
 * `checkout` renders the Delivery Address sheet over it (checkout/top, validation_error).
 */
export function CartScreen({ checkout = false }: { checkout?: boolean }) {
  const { search } = useLocation();
  const nav = useNavigate();
  const lines = cart.use();
  // `?code=TEST123` pre-types the coupon (prototype hook for tests/compare)
  const [code, setCode] = useState(() => new URLSearchParams(search).get("code") ?? "");
  const [codeError, setCodeError] = useState(false);

  const subtotal = lines.reduce((s, l) => s + lineProduct(l).price * l.qty, 0);
  const count = cartCount(lines);
  const empty = lines.length === 0;

  return (
    <Screen
      header={<NavHeader variant="arrow" title="Your Cart" />}
      bodyClassName="ct-body"
      footer={
        empty ? undefined : (
          <div className="ct-foot">
            <div className="ct-total">
              <span>
                Total ({count} {count === 1 ? "item" : "items"})
              </span>
              <b>{kr(subtotal + SHIPPING)}</b>
            </div>
            <button className="ct-cta" onClick={() => nav("/store/checkout")}>
              Proceed to Checkout
            </button>
          </div>
        )
      }
      overlay={checkout && !empty ? <CheckoutSheet onClose={() => nav("/store/cart")} /> : undefined}
    >
      {empty ? (
        <div className="ct-empty">
          <Icon name="cart" size={66} className="ct-empty-ico" />
          <h2>Your cart is empty</h2>
          <p>Browse our products and add items to your cart</p>
        </div>
      ) : (
        <div className="ct">
          {lines.map((l) => (
            <CartRow key={`${l.productId}|${l.finish}|${l.size}`} l={l} />
          ))}
          <div className="ct-box ct-code">
            <div className="ct-code-row">
              <input
                value={code}
                placeholder="Discount code"
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError(false);
                }}
              />
              {/* every code is rejected: no coupon was active on the captured account */}
              <button className="ct-apply" disabled={!code.trim()} onClick={() => setCodeError(true)}>
                Apply
              </button>
            </div>
            {codeError && <span className="ct-code-err">This coupon is not active</span>}
          </div>
          <div className="ct-box ct-sum">
            <Row label="Subtotal">{kr(subtotal)}</Row>
            <Row label="Shipping">{kr(SHIPPING)}</Row>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ct-sum-row">
      <span>{label}</span>
      <b>{children}</b>
    </div>
  );
}

function CartRow({ l }: { l: CartLine }) {
  const p = lineProduct(l);
  const variant = [l.finish && `Finish: ${l.finish}`, l.size && `Size: ${l.size}`].filter(Boolean).join(", ");
  // TODO(fidelity): cart thumbnail captured only for the Metal Black ring; others reuse the grid photo
  const thumb = p.id === "phenometech-ring" && l.finish === "Metal Black" ? "cart-ring-metal-black.jpg" : p.photo;
  return (
    <div className="ct-box ct-row">
      <img className="ct-thumb" src={photo(`store/${thumb}`)} alt="" />
      <div className="ct-row-main">
        <span className="ct-name">{p.name}</span>
        {variant && <span className="ct-var">{variant}</span>}
        <span className="ct-each">{kr(p.price)} each</span>
        <div className="ct-row-foot">
          <div className="ct-stp">
            <button aria-label="Decrease" onClick={() => changeQty(l, -1)}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M2 7h10" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <span>{l.qty}</span>
            <button aria-label="Increase" onClick={() => changeQty(l, 1)}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </div>
          <b className="ct-line">{krs(p.price * l.qty)}</b>
        </div>
      </div>
    </div>
  );
}
