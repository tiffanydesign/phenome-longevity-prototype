import { useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { ScreenRoute } from "../types";
import { StoreScreen } from "./StoreScreen";
import { ProductScreen } from "./ProductScreen";
import { CartScreen } from "./CartScreen";
import { seedFromQuery } from "./cartStore";

/** Prototype hook: applies `?seed=` (cart preset) before the screen mounts; remounts when the query changes. */
function Seeded({ children }: { children: ReactNode }) {
  const { search, pathname } = useLocation();
  useMemo(() => seedFromQuery(search), [search]);
  return (
    <div key={pathname + search} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

const S = (el: ReactNode) => <Seeded>{el}</Seeded>;

export const routes: ScreenRoute[] = [
  { path: "/store", element: S(<StoreScreen />), title: "Wellness Store", group: "Store" },
  { path: "/store/product/:id", element: S(<ProductScreen />), title: "Product detail", group: "Store" },
  { path: "/store/cart", element: S(<CartScreen />), title: "Your Cart", group: "Store" },
  { path: "/store/checkout", element: S(<CartScreen checkout />), title: "Checkout — Delivery Address", group: "Store" },
];
