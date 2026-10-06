import { Fragment, useMemo } from "react";
import { QuickLink } from "../types";
import { ExternalLink, HelpCircle, LayoutGrid, Plus, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { EmptyState, StaggerGrid, StaggerItem, GlassButton } from "./motion";
import { SectionToolbar } from "./shared";
import { durations } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useSyncedSearch } from "../hooks/useSyncedSearch";
import { useEntityModal } from "../hooks/useEntityModal";
import { useCategoryFilter } from "../hooks/useCategoryFilter";
import { LinkModal } from "./LinkModal";

interface LinksSectionProps {
  links: QuickLink[];
  initialSearch?: string;
  onUpsert: (item: QuickLink) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function LinksSection({
  links,
  initialSearch = "",
  onUpsert,
  onDelete,
}: LinksSectionProps) {
  const reduced = useReducedMotion();
  const [searchTerm, setSearchTerm] = useSyncedSearch(initialSearch);
  const { selectedCategory, setSelectedCategory, categories, matchesCategory } =
    useCategoryFilter(links, (link) => link.category);
  const { open, editingItem, openCreate, openEdit, close } = useEntityModal<QuickLink>();

  const categoryExtras = useMemo(() => links.map((l) => l.category), [links]);
  const query = searchTerm.toLowerCase();

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      (link.notes && link.notes.toLowerCase().includes(query)) ||
      link.category.toLowerCase().includes(query);
    return matchesSearch && matchesCategory(link);
  });

  return (
    <div className="space-y-6">
      <SectionToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search bookmarks and links..."
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoryIcon={<LayoutGrid className="w-4 h-4 text-fg-muted shrink-0" />}
        actions={
          <GlassButton variant="primary" onClick={openCreate} iconRight={<Plus className="w-4 h-4" />}>
            Add bookmark
          </GlassButton>
        }
      />

      {filteredLinks.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="w-8 h-8" />}
          message="No bookmarks found matching the search criteria."
        />
      ) : (
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <Fragment key={link.id}>
              <StaggerItem>
              <motion.div
                layout
                whileHover={reduced ? undefined : { y: -2 }}
                className="p-4 rounded-xl bg-panel border border-border hover:border-border hover:bg-panel transition-colors flex flex-col justify-between group h-full"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-panel-elevated border border-border text-fg-muted">
                      {link.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      className="rounded p-1 text-fg-subtle hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`Edit ${link.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-semibold text-fg tracking-tight leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                    {link.title}
                  </h4>

                  {link.notes && (
                    <p className="text-xs text-fg-muted leading-normal mt-1.5 font-sans font-light">
                      {link.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[12px] text-fg-subtle font-mono truncate max-w-[150px]">
                    {link.url.replace("https://", "").replace("http://", "")}
                  </span>
                  <motion.a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-sky-500/10 text-fg-muted hover:text-sky-700 dark:hover:text-sky-300 border border-border hover:border-sky-500/20 text-[13px] font-semibold transition-colors flex items-center gap-1 cursor-pointer glass-button"
                    whileHover={reduced ? undefined : { y: -1 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    transition={{ duration: durations.fast }}
                  >
                    <span>Open link</span>
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                </div>
              </motion.div>
            </StaggerItem>
            </Fragment>
          ))}
        </StaggerGrid>
      )}

      <LinkModal
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
