import { useMemo, useState, Fragment } from "react";
import { Landmark, ShieldAlert, Plus } from "lucide-react";
import { SearchInput } from "./SearchInput";
import type { StockExchangeLink } from "../types";
import { EmptyState, StaggerGrid, StaggerItem, GlassButton } from "./motion";
import { StockExchangeModal } from "./StockExchangeModal";
import { StockExchangeRow } from "./StockExchangeRow";
import {
  extractExchangeAcronym,
  resolveExchangeRegion,
  STOCK_EXCHANGE_COLUMNS,
  type StockExchangeRegion,
} from "../lib/stockExchange";

interface StockExchangeSectionProps {
  exchanges: StockExchangeLink[];
  onUpsert: (item: StockExchangeLink) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface RegionGroup {
  region: StockExchangeRegion;
  items: StockExchangeLink[];
}

function sortExchanges(items: StockExchangeLink[]): StockExchangeLink[] {
  return [...items].sort((a, b) => {
    const countryCompare = a.country.localeCompare(b.country);
    if (countryCompare !== 0) return countryCompare;
    const cityCompare = a.city.localeCompare(b.city);
    if (cityCompare !== 0) return cityCompare;
    return a.exchange.localeCompare(b.exchange);
  });
}

function groupByRegion(items: StockExchangeLink[]): RegionGroup[] {
  const order: StockExchangeRegion[] = [
    "Middle East & Africa",
    "Europe",
    "Asia & Oceania",
    "The Americas",
  ];
  const map = new Map<StockExchangeRegion, StockExchangeLink[]>();

  for (const item of items) {
    const region = resolveExchangeRegion(item.country);
    const list = map.get(region) ?? [];
    list.push(item);
    map.set(region, list);
  }

  return order
    .map((region) => ({
      region,
      items: sortExchanges(map.get(region) ?? []),
    }))
    .filter((group) => group.items.length > 0);
}

export default function StockExchangeSection({
  exchanges,
  onUpsert,
  onDelete,
}: StockExchangeSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockExchangeLink | null>(null);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return sortExchanges(exchanges);

    return sortExchanges(
      exchanges.filter((item) => {
        const acronym = extractExchangeAcronym(item.exchange).toLowerCase();
        const region = resolveExchangeRegion(item.country).toLowerCase();
        return (
          item.country.toLowerCase().includes(query) ||
          item.city.toLowerCase().includes(query) ||
          item.exchange.toLowerCase().includes(query) ||
          acronym.includes(query) ||
          region.includes(query) ||
          item.url.toLowerCase().includes(query) ||
          item.note.toLowerCase().includes(query)
        );
      })
    );
  }, [searchTerm, exchanges]);

  const regionGroups = useMemo(() => groupByRegion(filtered), [filtered]);
  const vpnCount = filtered.filter((item) => item.vpnRequired).length;

  const columns = useMemo(() => {
    return STOCK_EXCHANGE_COLUMNS.map((column) => ({
      ...column,
      groups: column.regions
        .map((region) => regionGroups.find((group) => group.region === region))
        .filter((group): group is RegionGroup => Boolean(group)),
    })).filter((column) => column.groups.length > 0);
  }, [regionGroups]);

  function openCreate() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item: StockExchangeLink) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
  }

  return (
    <div className="p-6 rounded-2xl glass-container border border-border relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Landmark className="w-48 h-48 text-fg" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Landmark className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-[22px] font-bold font-display text-fg">
              Global Stock Exchanges
            </h2>
            <p className="text-[12px] text-fg-muted font-sans mt-0.5">
              Official exchange portals for Company global client markets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="w-full lg:w-72">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search exchange..."
              inputClassName="w-full pl-9 pr-8 py-2 bg-panel-solid border border-border rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none text-sm font-sans input-glass-focus"
            />
          </div>
          <GlassButton
            variant="primary"
            onClick={openCreate}
            iconRight={<Plus className="w-4 h-4" />}
          >
            Add
          </GlassButton>
        </div>
      </div>

      {vpnCount > 0 && (
        <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 relative z-10">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          <p className="text-[11px] text-amber-900 dark:text-amber-200/90 font-sans">
            {vpnCount} exchange{vpnCount === 1 ? "" : "s"} require VPN — look for the{" "}
            <ShieldAlert className="w-3 h-3 inline -mt-0.5 text-amber-700 dark:text-amber-400" aria-hidden /> icon.
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<Landmark className="w-8 h-8" />} message="No exchanges match your search." />
      ) : (
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10 items-start">
          {columns.map((column) => (
            <Fragment key={column.title}>
              <StaggerItem>
                <section className="rounded-xl border border-border bg-panel p-2.5 flex flex-col gap-2.5 min-w-0">
                  {column.groups.map((group) => (
                    <div key={group.region} className="flex flex-col gap-1.5 min-w-0">
                      <h3 className="px-1 text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-300/90">
                        {group.region}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {group.items.map((item) => (
                          <Fragment key={item.id}>
                            <StockExchangeRow item={item} onEdit={openEdit} />
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              </StaggerItem>
            </Fragment>
          ))}
        </StaggerGrid>
      )}

      <StockExchangeModal
        open={modalOpen}
        item={editingItem}
        onClose={closeModal}
        onSave={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
