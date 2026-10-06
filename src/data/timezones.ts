import { TEAM_GLOBE_MARKERS } from "./teamGlobeMarkers";
import type { TimezoneConfig } from "../types";

export const TIMEZONES_TO_SHOW: TimezoneConfig[] = TEAM_GLOBE_MARKERS.map(
  ({ label: name, clockLabel: label, timezone }) => ({ name, label, timezone })
);
