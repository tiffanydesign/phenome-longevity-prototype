import { Navigate } from "react-router-dom";
import { photo } from "@/lib/asset";
import { BlurLayers, useGo, V2Screen } from "../../ui/shell";
import { sek } from "../ProductScreen";
import { hasScene } from "../StoreScreen";
import { readOrder } from "./data";
import "../bag.css";
import "./checkout.css";

/*
 * After paying: the outcome first (a tick and one line), then when it
 * arrives, where it goes and how it was paid, as one card of label and
 * value rows, then what was bought. One way forward at the foot.
 */
export function ConfirmScreen() {
  const go = useGo();
  const o = readOrder();
  if (!o) return <Navigate to="/v3/store" replace />;
  const a = o.address;
  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="bg scroll co3 co3-done">
        <section className="co3-ok">
          <span className="co3-ok-mark" aria-hidden>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h1>Order placed</h1>
          <p>
            Order {o.no} · {sek(o.total)}
          </p>
        </section>

        <dl className="co3-facts">
          <div>
            <dt>Arriving</dt>
            <dd>
              <b>{o.arrival}</b>
              <small>{o.ship} delivery</small>
            </dd>
          </div>
          <div>
            <dt>Deliver to</dt>
            <dd>
              <b>{a.name}</b>
              <small>
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}, {a.postal} {a.city}
              </small>
            </dd>
          </div>
          <div>
            <dt>Paid with</dt>
            <dd>
              <b>{o.pay}</b>
            </dd>
          </div>
        </dl>

        <h2 className="co3-h2">Items</h2>
        <ul className="bg-list co3-items">
          {o.lines.map((l) => (
            <li key={l.name + l.detail} className="co3-item">
              <i data-scene={hasScene(l.photo) || undefined}>
                <img src={photo(`store/${l.photo}`)} alt="" />
              </i>
              <span>
                <b>{l.name}</b>
                <small>
                  {l.detail ? `${l.detail} · ` : ""}Qty {l.qty}
                </small>
              </span>
              <em>{sek(l.price)}</em>
            </li>
          ))}
        </ul>
        <p className="co3-terms">We'll let you know when your order ships.</p>
      </div>

      <footer className="bg-foot">
        <button className="bg-cta" data-center="" onClick={(e) => go("/v3/store", { from: e.currentTarget })}>
          <span>Back to the store</span>
        </button>
      </footer>
    </V2Screen>
  );
}
