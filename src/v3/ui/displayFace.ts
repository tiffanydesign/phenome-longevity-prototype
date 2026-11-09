import { useEffect } from "react";

/** The twin's serif display face (Contralto), served from the Adobe Fonts kit the twin viewer uses. */
const KIT = "https://use.typekit.net/omf6kcr.css";

/** Loads the twin's display face once, on the screens that set titles in it. */
export function useDisplayFace(): void {
  useEffect(() => {
    if (document.querySelector(`link[href="${KIT}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = KIT;
    document.head.appendChild(l);
  }, []);
}
