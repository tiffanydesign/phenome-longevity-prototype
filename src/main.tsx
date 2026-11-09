import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/base.css";
import { EDITION, settleEdition } from "./lib/edition";

if (settleEdition()) {
  document.documentElement.dataset.ver = EDITION === "v3" ? "v3" : "v2";
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
