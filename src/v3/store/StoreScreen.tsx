import { useRef, useState } from "react";
import { photo } from "@/lib/asset";
import { useDataset, useOffline } from "@/lib/data";
import { CATEGORIES, storeProducts, type CategoryTab, type Product } from "@/data/store";
import { BrandBar, followHead, HeadBlur, useGo, V2Screen } from "../ui/shell";
import { cart, cartCount, changeQty, lineQty } from "@/screens/store/cartStore";
import "../home/home.css";
import "./store.css";

/*
 * The v3 Store: the same catalogue as the original edition, laid out like the
 * other v3 tabs. The brand bar floats over the grey ground, a large title and
 * one line under it, a white search field, the categories as a sliding
 * switch, then the products as white cards two to a row: the pack on a pale
 * tile, its name, its kind and its price.
 */

/**
 * Photos of a pack cut out on pure white (the test kits) sit on the pale blue
 * well. Every other photo was shot on its own backdrop (dark for the ring and
 * band, pale grey for the supplements) and fills the photo area as it is.
 */
const ON_WHITE = new Set([
  "comprehensive-genomic-test.jpg",
  "carrier-screening-test.jpg",
  "newborn-screening-test.jpg",
  "sports-performance-test.jpg",
  "gut-microbiome-test.jpg",
  "oral-microbiome-test.jpg",
]);
export const hasScene = (file: string) => !ON_WHITE.has(file);

const KIND: Record<string, string> = { Testing: "Test kit", Devices: "Device", Supplements: "Supplement" };
const price = (n: number) => `SEK ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function StoreScreen() {
  const go = useGo();
  const head = useRef<HTMLDivElement>(null);
  const products = useDataset(storeProducts);
  const offline = useOffline();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<CategoryTab>("All Products");

  const q = query.trim().toLowerCase();
  const shown = products.filter((p) => (tab === "All Products" || p.category === tab) && (!q || p.name.toLowerCase().includes(q)));

  return (
    <V2Screen>
      <div className="v2-head sx-head" ref={head}>
        <HeadBlur />
        <BrandBar right={<BagButton onOpen={(el) => go("/store/cart", { from: el })} />} />
      </div>
      <div className="sx scroll" onScroll={(e) => followHead(head.current, e.currentTarget.scrollTop, 52)}>
        <h1 className="sx-title">Store</h1>

        <label className="sx-search">
          <SearchMark />
          <input value={query} placeholder="Search products" onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
          {query && (
            <button type="button" className="sx-clear" aria-label="Clear search" onClick={() => setQuery("")}>
              ×
            </button>
          )}
        </label>

        {offline ? (
          <StoreError />
        ) : (
          <>
            <div className="sx-seg" role="tablist" aria-label="Categories">
              {CATEGORIES.map((c) => (
                <button key={c} role="tab" aria-selected={c === tab} onClick={() => setTab(c)}>
                  {c === "All Products" ? "All" : c}
                </button>
              ))}
            </div>

            <p className="sx-count">
              {shown.length} {shown.length === 1 ? "product" : "products"}
            </p>
            {shown.length ? (
              <div className="sx-grid">
                {shown.map((p) => (
                  <ProductCard key={p.id} p={p} onOpen={(el) => go(`/store/product/${p.id}`, { from: el })} />
                ))}
              </div>
            ) : (
              <p className="sx-empty">Nothing matches “{query}”.</p>
            )}
          </>
        )}
      </div>
    </V2Screen>
  );
}

/**
 * A product, all in one card: the pack on white, then a pale navy panel with
 * kind, name, and the price beside a round add button. Once in the bag the
 * button widens into a solid navy "Added" capsule. A product with options (finish, size)
 * opens its page instead of adding.
 */
function ProductCard({ p, onOpen }: { p: Product; onOpen: (el: HTMLElement) => void }) {
  const lines = cart.use();
  const options = !!(p.finishes?.length || p.sizes?.length);
  const inBag = options ? lines.some((l) => l.productId === p.id) : lineQty({ productId: p.id }) > 0;
  return (
    <div className="sx-card" data-scene={hasScene(p.photo) || undefined}>
      <button className="sx-card-open" aria-label={p.name} onClick={(e) => onOpen(e.currentTarget)} />
      <span className="sx-card-img" aria-hidden>
        <img src={photo(`store/${p.photo}`)} alt="" loading="lazy" />
      </span>
      <span className="sx-card-t">
        <small>{KIND[p.category] ?? p.category}</small>
        <b>{p.name}</b>
        <span className="sx-card-foot">
          <em>{price(p.price)}</em>
          <button
            className="sx-add"
            data-in={inBag ? "" : undefined}
            aria-label={options ? `Choose options for ${p.name}` : inBag ? `${p.name} is in your bag, add one more` : `Add ${p.name} to bag`}
            onClick={(e) => (options ? onOpen(e.currentTarget) : changeQty({ productId: p.id }, 1))}
          >
            {inBag ? "Added" : <PlusMark />}
          </button>
        </span>
      </span>
    </div>
  );
}


/** The bag in the top bar, in the profile button's place and manner: a navy disc that stays on glass as the page scrolls, with a red count once something is in it. */
function BagButton({ onOpen }: { onOpen: (el: HTMLElement) => void }) {
  const n = cartCount(cart.use());
  return (
    <button className="v2-avatar sx-hbag" aria-label={n ? `Bag, ${n} items` : "Bag"} onClick={(e) => onOpen(e.currentTarget)}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5.5 8h13l-1 12.5h-11z" />
        <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
      </svg>
      {n > 0 && <span className="sx-hbag-n">{n > 99 ? "99+" : n}</span>}
    </button>
  );
}

function PlusMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Offline: the catalogue could not load; one way to try again. */
function StoreError() {
  return (
    <div className="sx-error">
      <b>Couldn't load the store</b>
      <small>Check your connection and try again.</small>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );
}
