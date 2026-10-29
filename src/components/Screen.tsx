import type { CSSProperties, ReactNode } from "react";
import { HomeIndicator, StatusBar } from "./PhoneFrame";
import { TabBar } from "./TabBar";
import "./Screen.css";

interface ScreenProps {
  /** Fixed header rendered under the status bar (NavHeader, Home logo…). */
  header?: ReactNode;
  /** Show the floating tab bar + assistant button (tab roots only). */
  tabs?: boolean;
  /** Fixed footer above the home indicator (CTA bars, quantity steppers…). */
  footer?: ReactNode;
  /** White status-bar icons (Home, Capacity, Habit detail reproduce this). */
  statusTone?: "dark" | "light";
  /** Extra layers: sheets, modals, toasts. Rendered above everything. */
  overlay?: ReactNode;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}

/** One app screen: status bar + optional fixed header + scroll body + optional tab bar. */
export function Screen({ header, tabs, footer, statusTone, overlay, bodyClassName, bodyStyle, children }: ScreenProps) {
  return (
    <div className="scr" data-tabs={tabs ? "" : undefined}>
      <StatusBar tone={statusTone} />
      {header && <div className="scr-header">{header}</div>}
      <main className={`scr-body scroll ${bodyClassName ?? ""}`} style={bodyStyle} data-scroll-root>
        {children}
      </main>
      {footer && <div className="scr-footer">{footer}</div>}
      {tabs && <TabBar />}
      {overlay}
      <HomeIndicator />
    </div>
  );
}
