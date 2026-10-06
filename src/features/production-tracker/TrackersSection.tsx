import { useState } from "react";
import { Building2, Globe2 } from "lucide-react";
import { SegmentedTabs } from "../../components/motion";
import type { companymasterapp, ProductionTrackerEntry } from "../../types";
import { ProductionTrackerSection } from "./ProductionTrackerSection";
import { ExternalTrackerSection } from "./ExternalTrackerSection";
import type { TrackerSubTab } from "./constants";

interface TrackersSectionProps {
  apps: companymasterapp[];
  entries: ProductionTrackerEntry[];
  onUpsert: (entry: ProductionTrackerEntry) => Promise<void>;
  initialSearch?: string;
}

const SUB_TABS = [
  { id: "internal", label: "Internal", icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: "external", label: "External", icon: <Globe2 className="h-3.5 w-3.5" /> },
];

export function TrackersSection({
  apps,
  entries,
  onUpsert,
  initialSearch = "",
}: TrackersSectionProps) {
  const [subTab, setSubTab] = useState<TrackerSubTab>("internal");

  return (
    <div className="space-y-5">
      <SegmentedTabs
        tabs={SUB_TABS}
        activeId={subTab}
        onChange={(id) => setSubTab(id as TrackerSubTab)}
        className="max-w-md"
        layoutId="trackers-subtab"
      />

      {subTab === "internal" ? (
        <ProductionTrackerSection
          apps={apps}
          entries={entries}
          onUpsert={onUpsert}
          initialSearch={initialSearch}
        />
      ) : (
        <ExternalTrackerSection apps={apps} entries={entries} />
      )}
    </div>
  );
}
