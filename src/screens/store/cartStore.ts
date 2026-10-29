import { createStore } from "@/lib/data";
import { findProduct, type Product } from "@/data/store";

/** One cart row: product + chosen variant (capture cart/top: "Finish: Metal Black, Size: 8"). */
export interface CartLine {
  productId: string;
  finish?: string;
  size?: string;
  qty: number;
}

export const cart = createStore<CartLine[]>([]);

const same = (a: CartLine, b: Omit<CartLine, "qty">) => a.productId === b.productId && a.finish === b.finish && a.size === b.size;

export function lineQty(key: Omit<CartLine, "qty">): number {
  return cart.get().find((l) => same(l, key))?.qty ?? 0;
}

/** Add (delta > 0) or remove (delta < 0); rows reaching 0 disappear (cart/empty via "−"). */
export function changeQty(key: Omit<CartLine, "qty">, delta: number) {
  cart.set((lines) => {
    const i = lines.findIndex((l) => same(l, key));
    if (i < 0) return delta > 0 ? [...lines, { ...key, qty: delta }] : lines;
    const qty = lines[i].qty + delta;
    return qty <= 0 ? lines.filter((_, j) => j !== i) : lines.map((l, j) => (j === i ? { ...l, qty } : l));
  });
}

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);

export function lineProduct(l: CartLine): Product {
  const p = findProduct(l.productId);
  if (!p) throw new Error(`unknown product ${l.productId}`);
  return p;
}

/**
 * Prototype seed (not in the app): `?seed=ring` replaces the cart with the captured row
 * (cart/top), `?seed=empty` clears it — lets tests/compare open cart/checkout states directly.
 */
export function seedFromQuery(search: string) {
  const seed = new URLSearchParams(search).get("seed");
  if (seed === "ring") cart.set([{ productId: "phenometech-ring", finish: "Metal Black", size: "8", qty: 1 }]);
  if (seed === "empty") cart.set([]);
}
