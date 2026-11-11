import { type StudyView } from "./data";
import { CLINICAL } from "./viewsClinical";
import { OMICS } from "./viewsOmics";

export { VISITS, visitDate } from "./data";
export { Hero, VisitTrend } from "./parts";

/** A study's lead number and cards, for one visit. Field rules follow clinic-room-display.js. */
export const viewOf = (code: string, visit: number): StudyView => ({ ...CLINICAL, ...OMICS })[code](visit);
