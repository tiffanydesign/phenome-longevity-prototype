import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { CloseIcon } from "../shared/icons";
import { popOr } from "../shared/nav";
import "./meal.css";

/**
 * In-app meal camera. The capture (meal_camera/top) is a live room feed and must never be
 * reproduced — this is a dark viewfinder placeholder; only control positions come from its XML:
 * close 329.8–377.8 × 54.8–102.8, shutter 161.8–232 × 731.1–800.9.
 */
export function MealCamera() {
  const nav = useNavigate();
  return (
    <Screen statusTone="light">
      <div className="mc">
        <div className="mc-view" aria-label="Camera viewfinder (placeholder)" />
        <button className="mc-close" aria-label="Close camera" onClick={() => popOr(nav, "/journal/diet")}>
          <CloseIcon size={26} />
        </button>
        {/* TODO(fidelity): photo → AI nutrient detection flow intentionally not captured */}
        <button className="mc-shutter" aria-label="Take photo" />
      </div>
    </Screen>
  );
}
