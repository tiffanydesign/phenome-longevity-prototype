import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { findProduct, krs, RING_GALLERY, type Gallery } from "@/data/store";
import { photo } from "@/lib/asset";
import { cart, changeQty, lineQty } from "./cartStore";
import { CartButton, FinishPicker, ProductFooter, ProductGallery, SizePicker } from "./ProductParts";
import "./ProductScreen.css";

/**
 * Product detail — capture: product_device/top, scroll_1, scroll_2, finish_selected,
 * size_selected, added_to_cart; product_test/top, scroll_1; product_supplement/top, scroll_1;
 * dark_product_device/top.
 */
export function ProductScreen() {
  const { id } = useParams();
  const p = findProduct(id);
  const [finish, setFinish] = useState<string>();
  const [size, setSize] = useState<string>();
  cart.use(); // re-render on cart changes (stepper shows the in-cart quantity)

  if (!p) return <Navigate to="/store" replace />;

  const needsFinish = !!p.finishes && !finish;
  const needsSize = !!p.sizes && !size;
  const valid = !needsFinish && !needsSize;
  const key = { productId: p.id, finish, size };
  const qty = valid ? lineQty(key) : 0;
  const cta = needsFinish ? "Choose Finish" : needsSize ? "Choose Size" : "Add to Cart";

  // Choosing a finish swaps the carousel to that finish's photo set (finish_selected).
  // TODO(fidelity): only the Metal Black set was captured; other finishes keep the default set.
  const g: Gallery | undefined = p.finishes ? (finish && RING_GALLERY[finish]) || RING_GALLERY.default : p.gallery;

  return (
    <Screen
      header={<NavHeader variant="arrow" right={<CartButton />} />}
      bodyClassName="pd-body"
      footer={
        <ProductFooter
          qty={qty}
          enabled={valid}
          cta={cta}
          onMinus={() => changeQty(key, -1)}
          onPlus={() => changeQty(key, 1)}
          onCta={() => changeQty(key, 1)}
        />
      }
    >
      <div className="pd">
        {g ? (
          <ProductGallery g={g} />
        ) : (
          <>
            {/* TODO(fidelity): detail gallery not captured for this product — grid photo, no thumbnails */}
            <div className="pd-hero pd-hero-fallback">
              <img src={photo(`store/${p.photo}`)} alt="" />
            </div>
            <div className="pd-thumbs" />
          </>
        )}

        <div className="pd-info">
          <span className="pd-cat">{p.category}</span>
          <h1 className="pd-title">{p.name}</h1>
          <span className="pd-price">{krs(p.price)}</span>
        </div>

        {p.finishes && <FinishPicker p={p} value={finish} onChange={setFinish} />}
        {p.sizes && <SizePicker sizes={p.sizes} value={size} onChange={setSize} />}

        {p.bundle && (
          <div className="pd-bundle">
            <span>Buy 2, save 10%</span>
            {/* TODO(fidelity): the 10% bundle discount is applied server-side; the cart shows list price */}
            <button className="pd-bundle-add" onClick={() => changeQty(key, 2)}>
              Add 2
            </button>
          </div>
        )}

        {/* TODO(fidelity): descriptions captured only for Ring, Comprehensive Genomic Test and Vitamin D3+K2 */}
        {p.description && <p className="pd-desc">{p.description}</p>}
      </div>
    </Screen>
  );
}
