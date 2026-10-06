import { useEffect, useState } from "react";
import { Activity, Gauge, Smartphone, Users } from "lucide-react";
import type { companymasterapp } from "../types";
import { AnimatedNumber, GlassCard, StaggerGrid, StaggerItem } from "./motion";

const METRICS_URL = "https://database-api-reliability.vercel.app/api/metrics";
const REFRESH_INTERVAL_MS = 60_000;

interface ReliabilityMetrics {
  uptime: number;
  averageLatency: number;
}

function isReliabilityMetrics(value: unknown): value is ReliabilityMetrics {
  if (typeof value !== "object" || value === null) return false;

  const metrics = value as Record<string, unknown>;
  return (
    typeof metrics.uptime === "number" &&
    Number.isFinite(metrics.uptime) &&
    metrics.uptime >= 0 &&
    metrics.uptime <= 100 &&
    typeof metrics.averageLatency === "number" &&
    Number.isFinite(metrics.averageLatency) &&
    metrics.averageLatency >= 0
  );
}

interface MetricsSectionProps {
  companyApps: companymasterapp[];
}

export default function MetricsSection({ companyApps }: MetricsSectionProps) {
  const [metrics, setMetrics] = useState<ReliabilityMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let controller: AbortController | undefined;

    async function refreshMetrics() {
      controller = new AbortController();
      try {
        const response = await fetch(METRICS_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Metrics request failed (${response.status}).`);
        }

        const result: unknown = await response.json();
        if (!isReliabilityMetrics(result)) {
          throw new Error("Metrics response has an invalid format.");
        }

        if (!cancelled) {
          setMetrics(result);
          setError(null);
        }
      } catch (cause) {
        if (cancelled || (cause instanceof Error && cause.name === "AbortError")) return;
        console.error("Failed to load reliability metrics:", cause);
        setError("Unable to load reliability metrics. Retrying automatically.");
      } finally {
        if (!cancelled) {
          timer = window.setTimeout(refreshMetrics, REFRESH_INTERVAL_MS);
        }
      }
    }

    void refreshMetrics();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      controller?.abort();
    };
  }, []);

  const totalClients = companyApps.filter((app) => app.statusKey !== "cancelled").length;
  const liveApps = companyApps.filter((app) => app.statusKey === "online").length;

  const cards = [
    {
      title: "System Uptime",
      value: metrics ? `${metrics.uptime}%` : null,
      description: "Service availability",
      icon: <Activity className="h-14 w-14" />,
    },
    {
      title: "Avg. API Latency",
      value: metrics ? `${metrics.averageLatency} ms` : null,
      description: "24-hour average · checked every minute",
      icon: <Gauge className="h-14 w-14" />,
    },
    {
      title: "Live Apps",
      value: String(liveApps),
      description: "Online in the Company List",
      icon: <Smartphone className="h-14 w-14" />,
    },
    {
      title: "Total Clients",
      value: String(totalClients),
      description: "Excludes cancelled clients",
      icon: <Users className="h-14 w-14" />,
    },
  ];

  return (
    <StaggerGrid className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StaggerItem key={card.title} className="h-full min-h-0">
          <GlassCard
            index={index}
            className="group relative flex h-full flex-col justify-between overflow-hidden p-4 sm:p-5"
          >
            <div className="absolute right-0 top-0 p-4 text-fg opacity-5" aria-hidden="true">
              {card.icon}
            </div>
            <div className="relative z-10">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                Reliability
              </span>
              <h4 className="text-sm font-semibold tracking-tight text-fg-muted">{card.title}</h4>
            </div>
            <div className="relative z-10 mt-4 flex flex-wrap items-baseline justify-between gap-2">
              {card.value !== null ? (
                <AnimatedNumber
                  value={card.value}
                  className="bg-gradient-to-tr from-slate-900 via-slate-700 to-sky-700 bg-clip-text font-display text-2xl font-bold text-transparent dark:from-white dark:via-slate-100 dark:to-sky-300 sm:text-3xl"
                />
              ) : (
                <span className="text-sm text-fg-subtle" role="status">
                  {error ? "Unavailable" : "Loading…"}
                </span>
              )}
              <span className="font-mono text-[10px] text-fg-subtle">{card.description}</span>
            </div>
          </GlassCard>
        </StaggerItem>
      ))}
      {error && (
        <p className="sm:col-span-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </StaggerGrid>
  );
}
