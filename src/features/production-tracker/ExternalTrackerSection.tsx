import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Megaphone,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react";
import { SegmentedTabs } from "../../components/motion";
import { ModalShell } from "../../components/modals/ModalShell";
import type { companymasterapp, ProductionTrackerEntry } from "../../types";
import { matchProductionEntriesToApps } from "./matchApps";
import { phaseBadgeClass, priorityBadgeClass } from "./constants";

interface ExternalTrackerSectionProps {
  apps: companymasterapp[];
  entries: ProductionTrackerEntry[];
}

type TrackerGroupKey = "new" | "changes" | "release";
type ExternalView = "status" | "topics";

interface TrackerRecord {
  entry: ProductionTrackerEntry;
  app?: companymasterapp;
}

interface TrackerGroup {
  id: TrackerGroupKey;
  label: string;
  description: string;
  className: string;
  records: TrackerRecord[];
}

const GROUP_META: Omit<TrackerGroup, "records">[] = [
  {
    id: "new",
    label: "New apps",
    description: "New app builds in progress",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  },
  {
    id: "changes",
    label: "Changes ongoing",
    description: "Improvements and change requests",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  {
    id: "release",
    label: "For release",
    description: "Apps approaching launch",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
];

const PHASES_NEAR_RELEASE = new Set([
  "External Testing",
  "Submit the app for review",
  "Go live",
]);

function getGroupKey(record: TrackerRecord): TrackerGroupKey | null {
  const { entry, app } = record;
  if (
    ["Online", "Removed", "Cancelled"].includes(entry.priority) ||
    (app && ["online", "cancelled", "rejected"].includes(app.statusKey))
  ) {
    return null;
  }
  const phase = entry.currentPhase.toLowerCase();
  if (
    entry.priority === "For Release" ||
    phase === "submit the app for review" ||
    phase === "go live"
  ) {
    return "release";
  }
  if (
    app?.hasChanges === "Yes" ||
    app?.ongoingV2Production.toLowerCase() === "yes"
  ) {
    return "changes";
  }
  if (
    app &&
    (app.upgradeOrNewOrder.toLowerCase().includes("new") ||
      app.statusKey === "new") &&
    !["online", "cancelled", "rejected"].includes(app.statusKey)
  ) {
    return "new";
  }
  return null;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function ExternalTrackerSection({
  apps,
  entries,
}: ExternalTrackerSectionProps) {
  const [view, setView] = useState<ExternalView>("status");
  const [selectedGroup, setSelectedGroup] = useState<TrackerGroup | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TrackerRecord | null>(
    null
  );

  const groups = useMemo(() => {
    const appsById = new Map(apps.map((app) => [app.id, app]));
    const records = matchProductionEntriesToApps(entries, apps).map((entry) => ({
      entry,
      app: entry.companyAppId ? appsById.get(entry.companyAppId) : undefined,
    }));

    return GROUP_META.map((group) => ({
      ...group,
      records: records
        .filter((record) => getGroupKey(record) === group.id)
        .sort((a, b) => a.entry.clientName.localeCompare(b.entry.clientName)),
    }));
  }, [apps, entries]);

  const recordsByGroup = useMemo(
    () => new Map(groups.map((group) => [group.id, group.records])),
    [groups]
  );
  const upcomingRecords = useMemo(
    () =>
      groups
        .flatMap((group) => group.records)
        .filter((record) => PHASES_NEAR_RELEASE.has(record.entry.currentPhase)),
    [groups]
  );
  const changeRecords = recordsByGroup.get("changes") ?? [];
  const releaseRecords = recordsByGroup.get("release") ?? [];
  const totalTracked = groups.reduce((count, group) => count + group.records.length, 0);

  function openRecord(record: TrackerRecord) {
    setSelectedGroup(null);
    setSelectedRecord(record);
  }

  return (
    <section className="space-y-4" aria-label="External tracker">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold text-fg">
            External team brief
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            A shareable view of delivery progress and discussion-ready updates.
          </p>
        </div>
        <SegmentedTabs
          tabs={[
            { id: "status", label: "Status overview" },
            { id: "topics", label: "Discussion topics" },
          ]}
          activeId={view}
          onChange={(id) => setView(id as ExternalView)}
          className="w-full sm:w-auto"
          layoutId="external-tracker-view"
        />
      </div>

      {view === "status" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="mb-3 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
              Apps by delivery status
            </p>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  title={`${group.description} — click to view app details`}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${group.className}`}
                  aria-label={`Show ${group.records.length} apps: ${group.label}`}
                >
                  <span className="text-xs font-semibold">{group.label}</span>
                  <span className="rounded-full border border-current/20 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
                    {group.records.length}
                  </span>
                  <ArrowUpRight className="h-3 w-3 opacity-70" />
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-fg-subtle">
            {totalTracked} tracked apps across these external status groups. Select a
            status pill to open quick context for each app.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TopicCard
            icon={<Megaphone className="h-4 w-4" />}
            title="Announcements"
            description="Portfolio snapshot for cross-team updates"
            accent="text-violet-700 dark:text-violet-300"
          >
            <p className="text-xs leading-relaxed text-fg-muted">
              Use this summary to align teams on current delivery focus before
              discussing client-specific updates.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {groups.map((group) => (
                <span
                  key={group.id}
                  className="rounded-full border border-border bg-panel-solid/70 px-2.5 py-1 text-[10px] text-fg-muted"
                >
                  {group.label}: <strong className="text-fg">{group.records.length}</strong>
                </span>
              ))}
            </div>
          </TopicCard>

          <TopicCard
            icon={<Rocket className="h-4 w-4" />}
            title="Upcoming updates"
            description="Testing, review, and go-live milestones"
            accent="text-sky-700 dark:text-sky-300"
          >
            <RecordList
              records={upcomingRecords}
              emptyMessage="No apps are currently in external testing or release milestones."
              onSelect={openRecord}
            />
          </TopicCard>

          <TopicCard
            icon={<Wrench className="h-4 w-4" />}
            title="Recent changes & improvements"
            description="Apps with active change work"
            accent="text-amber-700 dark:text-amber-300"
          >
            <RecordList
              records={changeRecords}
              emptyMessage="No active change items are linked to the production tracker."
              onSelect={openRecord}
            />
          </TopicCard>

          <TopicCard
            icon={<Sparkles className="h-4 w-4" />}
            title="New feature releases"
            description="Feature context for apps approaching release"
            accent="text-emerald-700 dark:text-emerald-300"
          >
            <RecordList
              records={releaseRecords}
              emptyMessage="No apps are currently marked for release."
              onSelect={openRecord}
              showFeatures
            />
          </TopicCard>
        </div>
      )}

      <GroupDetailsModal
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onSelectRecord={openRecord}
      />
      <RecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </section>
  );
}

function TopicCard({
  icon,
  title,
  description,
  accent,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-border bg-panel p-4">
      <header className="mb-3 flex items-start gap-2.5">
        <span className={`mt-0.5 ${accent}`}>{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          <p className="mt-0.5 text-[11px] text-fg-subtle">{description}</p>
        </div>
      </header>
      {children}
    </article>
  );
}

function RecordList({
  records,
  emptyMessage,
  onSelect,
  showFeatures = false,
}: {
  records: TrackerRecord[];
  emptyMessage: string;
  onSelect: (record: TrackerRecord) => void;
  showFeatures?: boolean;
}) {
  if (records.length === 0) {
    return <p className="text-xs text-fg-subtle">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {records.map((record) => {
        const name = record.app?.companyName ?? record.entry.clientName;
        const featureNames = record.app
          ? [
              record.app.accountFeature.value === "yes" && "Account",
              record.app.media.value === "yes" && "Media",
              record.app.aiFeatures.value === "yes" && "AI",
            ].filter((feature): feature is string => Boolean(feature))
          : [];
        return (
          <li key={record.entry.id}>
            <button
              type="button"
              onClick={() => onSelect(record)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-panel-solid/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-fg">
                  {name}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-fg-subtle">
                  {showFeatures && featureNames.length > 0
                    ? `Features: ${featureNames.join(", ")}`
                    : record.entry.comments || record.entry.currentPhase}
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function GroupDetailsModal({
  group,
  onClose,
  onSelectRecord,
}: {
  group: TrackerGroup | null;
  onClose: () => void;
  onSelectRecord: (record: TrackerRecord) => void;
}) {
  return (
    <ModalShell
      open={Boolean(group)}
      title={group ? `${group.label} · ${group.records.length}` : "App details"}
      description={group?.description}
      onClose={onClose}
      wide
    >
      {group && (
        <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
          {group.records.length === 0 ? (
            <p className="py-4 text-center text-xs text-fg-subtle">
              No apps currently match this status.
            </p>
          ) : (
            group.records.map((record) => (
              <button
                type="button"
                key={record.entry.id}
                onClick={() => onSelectRecord(record)}
                className="w-full rounded-xl border border-border bg-panel-solid/60 p-3 text-left transition hover:border-sky-500/40 hover:bg-panel-solid"
              >
                <RecordSummary record={record} />
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                  Open quick context <ArrowUpRight className="h-3 w-3" />
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </ModalShell>
  );
}

function RecordDetailsModal({
  record,
  onClose,
}: {
  record: TrackerRecord | null;
  onClose: () => void;
}) {
  const featureNames = record?.app
    ? [
        record.app.accountFeature.value === "yes" && "Account",
        record.app.media.value === "yes" && "Media",
        record.app.aiFeatures.value === "yes" && "AI",
      ].filter((feature): feature is string => Boolean(feature))
    : [];

  return (
    <ModalShell
      open={Boolean(record)}
      title={record?.app?.companyName ?? record?.entry.clientName ?? "App details"}
      description="Quick context for external team discussions"
      onClose={onClose}
    >
      {record && (
        <div className="space-y-4">
          <RecordSummary record={record} />
          {record.app && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-panel-solid/50 p-3">
              <Detail label="App status" value={record.app.statusLabel} />
              <Detail label="Order type" value={record.app.upgradeOrNewOrder} />
              <Detail label="Live version" value={record.app.liveVersion} />
              <Detail label="Country / market" value={[record.app.country, record.app.market].filter(Boolean).join(" / ")} />
              {featureNames.length > 0 && (
                <div className="col-span-2">
                  <Detail label="Enabled features" value={featureNames.join(", ")} />
                </div>
              )}
            </div>
          )}
          <div className="rounded-xl border border-border bg-panel-solid/50 p-3">
            <Detail
              label="Discussion note"
              value={record.entry.comments?.trim() || "No discussion notes have been added yet."}
            />
          </div>
          <p className="text-[10px] text-fg-subtle">
            Tracker updated {formatUpdatedAt(record.entry.updatedAt)}
          </p>
        </div>
      )}
    </ModalShell>
  );
}

function RecordSummary({ record }: { record: TrackerRecord }) {
  return (
    <div>
      <p className="text-sm font-semibold text-fg">
        {record.app?.companyName ?? record.entry.clientName}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {record.app && (
          <span className="rounded-md border border-border bg-panel px-2 py-0.5 text-[10px] text-fg-muted">
            {record.app.statusLabel}
          </span>
        )}
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${phaseBadgeClass(record.entry.currentPhase)}`}
        >
          {record.entry.currentPhase || "Phase not set"}
        </span>
        {record.entry.priority && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${priorityBadgeClass(record.entry.priority)}`}
          >
            {record.entry.priority}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-fg-subtle">
        <span>Dev: {record.entry.assignedDev || "Unassigned"}</span>
        <span>AS: {record.entry.assignedPss || "Unassigned"}</span>
      </div>
      {record.entry.comments && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-fg-muted">
          {record.entry.comments}
        </p>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-mono uppercase tracking-wider text-fg-subtle">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs text-fg">{value || "—"}</p>
    </div>
  );
}
