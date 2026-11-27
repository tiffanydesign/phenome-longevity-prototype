import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CHECKOUT_NAME } from "@/data/store";
import { cart, lineProduct } from "@/screens/store/cartStore";
import { Chevron } from "../../ui/icons";
import { BlurLayers, V2Screen } from "../../ui/shell";
import { sek } from "../ProductScreen";
import { OrderSummary } from "./OrderSummary";
import { AddressStep, PayStep, ShipStep, Step } from "./steps";
import { arrival, PAY, saveOrder, SHIP, type Address, type PayId, type ShipId } from "./data";
import "../bag.css";
import "./checkout.css";

/*
 * Checkout, one page in three steps. The order sits on top so the member
 * always sees what they are paying for. Below it the steps run in order:
 * the open step is expanded, finished ones fold to one line of what was
 * chosen with an Edit, the rest wait as titles. One button at the foot
 * moves forward; on the last step it carries the amount ("Pay SEK …").
 */

export type Phase = 0 | 1 | 2;

export interface Delivery {
  address: Address | null;
  query: string;
  line2: string;
  phone: string;
}

export function CheckoutScreen() {
  const nav = useNavigate();
  const lines = cart.use();
  const [scrolled, setScrolled] = useState(false);
  const [phase, setPhase] = useState<Phase>(0);
  const [tried, setTried] = useState(false);
  const [d, setD] = useState<Delivery>({ address: null, query: "", line2: "", phone: "" });
  const [ship, setShip] = useState<ShipId>("standard");
  const [pay, setPay] = useState<PayId>("card");

  if (lines.length === 0) return <Navigate to="/store/cart" replace />;

  const subtotal = lines.reduce((s, l) => s + lineProduct(l).price * l.qty, 0);
  const shipOpt = SHIP.find((s) => s.id === ship)!;
  const total = subtotal + shipOpt.price;

  const phoneOk = d.phone.replace(/\D/g, "").length >= 7;
  const addressOk = !!d.address && phoneOk;

  const next = () => {
    if (phase === 0) {
      setTried(true);
      if (!addressOk) return;
      setTried(false);
      return setPhase(1);
    }
    if (phase === 1) return setPhase(2);
    place();
  };

  const place = () => {
    const a = d.address!;
    saveOrder({
      no: `PL-${String(Date.now()).slice(-6)}`,
      lines: lines.map((l) => {
        const p = lineProduct(l);
        return { name: p.name, detail: [l.finish, l.size && `Size ${l.size}`].filter(Boolean).join(" · ") || undefined, qty: l.qty, price: p.price * l.qty, photo: p.photo };
      }),
      total,
      address: { ...a, line2: d.line2.trim() || undefined, name: CHECKOUT_NAME },
      ship: shipOpt.name,
      arrival: arrival(shipOpt.days),
      pay: PAY.find((p) => p.id === pay)!.name,
    });
    cart.set([]);
    nav("/store/checkout/done", { replace: true });
  };

  const state = (n: Phase) => (phase === n ? "open" : phase > n ? "done" : "next");

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="bg scroll co3" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 48)}>
        <header className="bg-bar" data-scrolled={scrolled || undefined}>
          <button className="bg-round" aria-label="Back to bag" onClick={() => nav("/store/cart")}>
            <Chevron dir="left" size={22} />
          </button>
          <span className="bg-bar-title">Checkout</span>
          <span aria-hidden />
        </header>

        <section className="bg-hero">
          <h1>Checkout</h1>
          <p>Step {phase + 1} of 3</p>
        </section>

        <OrderSummary lines={lines} subtotal={subtotal} shipping={shipOpt.price} total={total} />

        <ol className="co3-steps">
          <Step
            n={1}
            title="Delivery address"
            state={state(0)}
            summary={d.address ? [CHECKOUT_NAME, `${d.address.line1}${d.line2 ? `, ${d.line2}` : ""}`, `${d.address.postal} ${d.address.city}`] : undefined}
            onEdit={() => setPhase(0)}
          >
            <AddressStep d={d} set={(patch) => setD((x) => ({ ...x, ...patch }))} tried={tried} phoneOk={phoneOk} />
          </Step>
          <Step n={2} title="Delivery" state={state(1)} summary={[`${shipOpt.name} · ${arrival(shipOpt.days)}`]} onEdit={() => setPhase(1)}>
            <ShipStep value={ship} onChange={setShip} />
          </Step>
          <Step n={3} title="Payment" state={state(2)} onEdit={() => setPhase(2)}>
            <PayStep value={pay} onChange={setPay} />
          </Step>
        </ol>

        {phase === 2 && <p className="co3-terms">By paying you accept the terms of sale.</p>}
      </div>

      <footer className="bg-foot">
        <button className="bg-cta" data-center={phase < 2 || undefined} onClick={next}>
          {phase < 2 ? (
            <span>{phase === 0 ? "Continue to delivery" : "Continue to payment"}</span>
          ) : (
            <>
              <span>Pay</span>
              <em>{sek(total)}</em>
            </>
          )}
        </button>
      </footer>
    </V2Screen>
  );
}
