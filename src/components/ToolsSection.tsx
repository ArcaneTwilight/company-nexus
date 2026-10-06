import { Fragment, useMemo } from "react";
import { ToolItem } from "../types";
import { ExternalLink, AlertTriangle, Layers, Plus, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard, EmptyState, StaggerGrid, StaggerItem, GlassButton } from "./motion";
import { SectionToolbar } from "./shared";
import { durations } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useSyncedSearch } from "../hooks/useSyncedSearch";
import { useEntityModal } from "../hooks/useEntityModal";
import { useCategoryFilter } from "../hooks/useCategoryFilter";
import { ToolModal } from "./ToolModal";

interface ToolsSectionProps {
  tools: ToolItem[];
  initialSearch?: string;
  onUpsert: (item: ToolItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ToolsSection({
  tools,
  initialSearch = "",
  onUpsert,
  onDelete,
}: ToolsSectionProps) {
  const reduced = useReducedMotion();
  const [searchTerm, setSearchTerm] = useSyncedSearch(initialSearch);
  const { selectedCategory, setSelectedCategory, categories, matchesCategory } =
    useCategoryFilter(tools, (tool) => tool.category);
  const { open, editingItem, openCreate, openEdit, close } = useEntityModal<ToolItem>();

  const categoryExtras = useMemo(() => tools.map((t) => t.category), [tools]);
  const query = searchTerm.toLowerCase();

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query);
    return matchesSearch && matchesCategory(tool);
  });

  return (
    <div className="space-y-6">
      <SectionToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search tools and apps..."
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryIcon={<Layers className="w-4 h-4 text-fg-muted shrink-0" />}
        actions={
          <GlassButton variant="primary" onClick={openCreate} iconRight={<Plus className="w-4 h-4" />}>
            Add tool
          </GlassButton>
        }
      />

      {filteredTools.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          message="No tools found matching search parameters."
        />
      ) : (
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTools.map((tool, index) => (
            <Fragment key={tool.id}>
              <StaggerItem>
                <GlassCard layout index={index} className="p-5 flex flex-col group">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-mono tracking-wider bg-panel-elevated text-fg-muted border border-border uppercase shrink-0">
                        {tool.category}
                      </span>
                      <span className="text-[12px] text-fg-subtle font-mono">
                        Synced: {tool.lastUpdated || "Active"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tool.status === "Live"
                              ? "bg-emerald-500 animate-pulse"
                              : tool.status === "In Development"
                                ? "bg-amber-500"
                                : "bg-slate-500"
                          }`}
                        />
                        <span className="text-[12px] text-fg-muted font-mono">{tool.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEdit(tool)}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-2.5 py-1.5 text-[11px] font-mono text-fg-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label={`Edit ${tool.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <motion.a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-500 hover:text-white transition-colors flex items-center gap-1.5 glass-button cursor-pointer"
                        whileHover={
                          reduced ? undefined : { y: -1, boxShadow: "0 4px 16px rgba(56, 189, 248, 0.15)" }
                        }
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        transition={{ duration: durations.fast }}
                      >
                        <span>Launch</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </motion.a>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold font-display text-fg group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-fg-muted leading-relaxed mt-2 font-sans font-light">
                    {tool.description}
                  </p>
                </GlassCard>
              </StaggerItem>
            </Fragment>
          ))}
        </StaggerGrid>
      )}

      <ToolModal
        open={open}
        item={editingItem}
        existingCategories={categoryExtras}
        onClose={close}
        onSave={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
