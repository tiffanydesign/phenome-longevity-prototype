import type { MetricDef, Period } from "@/data/home-monitor";
import type { RealPage } from "@/data/real";
import { MoveBody } from "./MoveBody";
import { VitalBody } from "./VitalBody";
import { SleepScoreBody, SleepSubBody } from "./SleepBody";
import "./filled.css";

/** Health Monitor body for the synced account, by page kind. */
export function FilledBody({ m, page, period }: { m: MetricDef; page: RealPage; period: Period }) {
  if (page.kind === "vital") return <VitalBody m={m} p={page} period={period} />;
  if (page.kind === "move") return <MoveBody m={m} p={page} period={period} />;
  return m.id === "sleep" ? <SleepScoreBody m={m} labels={page.labels} period={period} /> : <SleepSubBody m={m} labels={page.labels} period={period} />;
}
