import { useRef, useState } from "react";
import { photo } from "@/lib/asset";
import { useDataset, useOffline } from "@/lib/data";
import { CATEGORIES, storeProducts, type CategoryTab, type Product } from "@/data/store";
import { BrandBar, followHead, HeadBlur, useGo, V2Screen } from "../ui/shell";
import "../home/home.css";
import "./store.css";

/*
 * The v3 Store: the same catalogue as the original edition, laid out like the
 * other v3 tabs. The brand bar floats over the grey ground, a large title and
 * one line under it, a white search field, the categories as a sliding
 * switch, then the products as white cards two to a row: the pack on a pale
 * tile, its name, its kind and its price.
 */

const KIND: Record<string, string> = { Testing: "Test kit", Devices: "Device", Supplements: "Supplement" };
const price = (n: number) => `${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kr`;

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
        <BrandBar />
      </div>
      <div className="sx scroll" onScroll={(e) => followHead(head.current, e.currentTarget.scrollTop, 52)}>
        <h1 className="sx-title">Store</h1>
        <p className="sx-sub">Test kits, devices and supplements, chosen to go with your plan.</p>

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

/** A product: the pack on a pale tile, then name, kind and price. */
function ProductCard({ p, onOpen }: { p: Product; onOpen: (el: HTMLElement) => void }) {
  return (
    <button className="sx-card" onClick={(e) => onOpen(e.currentTarget)}>
      <span className="sx-card-img">
        <img src={photo(`store/${p.photo}`)} alt="" loading="lazy" />
      </span>
      <span className="sx-card-t">
        <small>{KIND[p.category] ?? p.category}</small>
        <b>{p.name}</b>
        <em>{price(p.price)}</em>
      </span>
    </button>
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
