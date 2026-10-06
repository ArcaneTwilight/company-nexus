import type { MetricItem } from "../types";

export const INITIAL_METRICS: MetricItem[] = [
  {
    id: "metric-1",
    title: "Total Clients",
    value: "148",
    category: "KPIs",
    lastUpdated: "2026-07-07"
  },
  {
    id: "metric-2",
    title: "Live Production Clients",
    value: "135",
    category: "KPIs",
    lastUpdated: "2026-07-07"
  },
  {
    id: "metric-3",
    title: "Average App API Latency",
    value: "124 ms",
    category: "Engineering",
    lastUpdated: "2026-07-07"
  },
  {
    id: "metric-4",
    title: "Core Service Uptime",
    value: "99.98%",
    category: "Operations",
    lastUpdated: "2026-07-07"
  }
];
