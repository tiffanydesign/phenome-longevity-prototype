import { useState } from "react";
import { photo } from "@/lib/asset";
import { lineProduct, type CartLine } from "@/screens/store/cartStore";
import { Chevron } from "../../ui/icons";
import { sek } from "../ProductScreen";
import { hasScene } from "../StoreScreen";

/*
 * The order, folded to one line: the packs side by side, how many items,
 * and the total. Open, it lists each item and the price breakdown, so the
 * member can check what they pay for without leaving the checkout.
 */
export function OrderSummary({ lines, subtotal, shipping, total }: { lines: CartLine[]; subtotal: number; shipping: number; total: number }) {
  const [open, setOpen] = useState(false);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return (
    <section className="co3-order" data-open={open || undefined}>
      <button className="co3-order-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="co3-packs" aria-hidden>
          {lines.slice(0, 3).map((l) => (
            <Thumb key={`${l.productId}|${l.finish}|${l.size}`} l={l} />
          ))}
        </span>
        <span className="co3-order-t">
          <b>
            {count} {count === 1 ? "item" : "items"}
          </b>
          <small>{open ? "Hide details" : "Show details"}</small>
        </span>
        <b className="co3-order-total">{sek(total)}</b>
        <Chevron dir={open ? "up" : "down"} size={13} />
      </button>

      {open && (
        <div className="co3-order-body">
          <ul>
            {lines.map((l) => {
              const p = lineProduct(l);
              const detail = [l.finish, l.size && `Size ${l.size}`].filter(Boolean).join(" · ");
              return (
                <li key={`${l.productId}|${l.finish}|${l.size}`}>
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {detail ? `${detail} · ` : ""}Qty {l.qty}
                    </small>
                  </span>
                  <em>{sek(p.price * l.qty)}</em>
                </li>
              );
            })}
          </ul>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{sek(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{sek(shipping)}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

function Thumb({ l }: { l: CartLine }) {
  const p = lineProduct(l);
  const file = p.id === "phenometech-ring" && l.finish === "Metal Black" ? "cart-ring-metal-black.jpg" : p.photo;
  return (
    <i data-scene={(file !== "cart-ring-metal-black.jpg" && hasScene(file)) || undefined}>
      <img src={photo(`store/${file}`)} alt="" />
    </i>
  );
}
