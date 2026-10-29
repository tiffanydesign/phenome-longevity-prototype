import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { photo } from "@/lib/asset";
import { useDataset, useOffline } from "@/lib/data";
import { CATEGORIES, kr, storeProducts, type CategoryTab, type Product } from "@/data/store";
import "./StoreScreen.css";

/**
 * Store tab — capture: tab_store/top, scroll_1…7, filter_devices, search_results,
 * offline/store, dark_tab_store/top.
 */
export function StoreScreen() {
  const products = useDataset(storeProducts);
  const offline = useOffline();
  const { search } = useLocation();
  // `?q=vitamin` pre-types the search (prototype hook for tests/compare; app has none)
  const initialQ = new URLSearchParams(search).getAll("q").pop() ?? "";
  const [query, setQuery] = useState(initialQ);
  const [focused, setFocused] = useState(initialQ !== "");
  const [tab, setTab] = useState<CategoryTab>("All Products");

  const q = query.trim().toLowerCase();
  const shown = products.filter((p) => (tab === "All Products" || p.category === tab) && (!q || p.name.toLowerCase().includes(q)));

  return (
    <Screen tabs statusTone="light" header={<StoreLogo />} bodyClassName="st-body" overlay={focused ? <Keyboard onDone={() => setFocused(false)} /> : undefined}>
      <div className="st">
        <h1 className="st-title">Wellness Store</h1>
        <label className="st-search">
          <input
            value={query}
            placeholder="Search products..."
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus={initialQ !== ""}
          />
          <SearchGlyph />
        </label>

        {offline ? (
          <StoreError />
        ) : (
          <>
            <div className="st-tabs" role="tablist">
              {CATEGORIES.map((c) => (
                <button key={c} role="tab" className="st-tab" data-active={c === tab || undefined} onClick={() => setTab(c)}>
                  {c}
                </button>
              ))}
            </div>
            <div className="st-grid">
              {shown.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

function StoreLogo() {
  return (
    <div className="st-logo">
      <Icon name="PL_Logo" size={36} style={{ height: 24 }} />
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const nav = useNavigate();
  return (
    <button className="st-card" onClick={() => nav(`/store/product/${p.id}`)}>
      <span className="st-card-in">
        <img className="st-card-img" src={photo(`store/${p.photo}`)} alt="" />
        <span className="st-card-label">
          <span className="st-card-name">{p.name}</span>
          <span className="st-card-price">{kr(p.price)}</span>
        </span>
      </span>
    </button>
  );
}

/** capture: offline/store — red "!" circle, message and navy Retry pill. */
function StoreError() {
  return (
    <div className="st-error">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden>
        <circle cx="26" cy="26" r="23.5" stroke="currentColor" strokeWidth="5" />
        <path d="M26 13v16" stroke="currentColor" strokeWidth="5" />
        <rect x="23.5" y="34" width="5" height="5" fill="currentColor" />
      </svg>
      <p className="st-error-text">Failed to load products</p>
      {/* TODO(fidelity): Retry re-requests the catalogue; offline mode keeps the error state */}
      <button className="st-retry" onClick={() => window.location.reload()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 12a8 8 0 1 1-2.6-5.9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M20.5 3.5v5h-5" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        </svg>
        Retry
      </button>
    </div>
  );
}

export function SearchGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg className="st-search-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2.2" />
      <path d="M15.2 15.2 21 21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Android IME shown while the search field is focused (capture tab_store/search_results).
 * Static crop of the captured Gboard — the prototype has no real soft keyboard.
 */
function Keyboard({ onDone }: { onDone: () => void }) {
  return (
    <div className="st-kb" onMouseDown={(e) => e.preventDefault()}>
      <img src={photo("store/keyboard.png")} alt="" />
      <button className="st-kb-done" aria-label="Done" onClick={onDone} />
    </div>
  );
}
