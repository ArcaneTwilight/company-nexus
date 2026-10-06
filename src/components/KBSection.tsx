import { useState, useEffect, Fragment, useMemo } from "react";
import { KBItem } from "../types";
import { Cpu, ArrowRight, Plus, Pencil } from "lucide-react";
import { SearchInput } from "./SearchInput";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { FilterChip, EmptyState, GlassButton } from "./motion";
import { fadeScale, transitions } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { renderMarkdownPreview } from "../lib/lightMarkdown";
import { KbArticleModal } from "./KbArticleModal";

interface KBSectionProps {
  articles: KBItem[];
  initialSearch?: string;
  onUpsert: (item: KBItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
export default function KBSection({
  articles,
  initialSearch = "",
  onUpsert,
  onDelete,
}: KBSectionProps) {
  const reduced = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeArticle, setActiveArticle] = useState<KBItem | null>(
    articles.length > 0 ? articles[0] : null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KBItem | null>(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const categoryExtras = useMemo(() => articles.map((a) => a.category), [articles]);
  const categories = [
    "All",
    ...Array.from(new Set(articles.filter((a) => !a.isArchived).map((a) => a.category))),
  ];

  function openCreate() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(article: KBItem) {
    setEditingItem(article);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
  }
  const filteredArticles = articles.filter((art) => {
    if (art.isArchived) return false;
    const matchesSearch =
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          onClick={openCreate}
          iconRight={<Plus className="w-4 h-4" />}
        >
          Add article
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-col gap-3 bg-panel p-3 rounded-xl border border-border">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search Dev KB articles..."
                inputClassName="w-full pl-9 pr-8 py-1.5 bg-panel-solid border border-border rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-sky-500/50 transition-all text-xs font-sans"
              />

              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                <LayoutGroup>
                  {categories.map((cat) => (
                    <Fragment key={cat}>
                      <FilterChip
                        label={cat}
                        active={selectedCategory === cat}
                        onClick={() => setSelectedCategory(cat)}
                      />
                    </Fragment>
                  ))}
                </LayoutGroup>
              </div>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredArticles.length === 0 ? (
                <EmptyState icon={<Cpu className="w-8 h-8" />} message="No technical articles found." />
              ) : (
                filteredArticles.map((art, index) => (
                  <motion.button
                    key={art.id}
                    layout
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...transitions.enter, delay: reduced ? 0 : index * 0.03 }}
                    onClick={() => setActiveArticle(art)}
                    className={`w-full p-4 rounded-xl text-left border transition-colors flex justify-between items-center group cursor-pointer ${
                      activeArticle?.id === art.id
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 shadow-lg shadow-sky-500/5"
                        : "bg-panel border-border text-fg-muted hover:text-fg hover:border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="text-[11px] uppercase font-mono tracking-wider text-fg-subtle block mb-1">
                        {art.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-fg tracking-tight leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors truncate">
                        {art.title}
                      </h4>
                      <p className="text-[12px] text-fg-subtle font-mono mt-1">
                        Modified: {art.lastUpdated}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-sky-400" />
                  </motion.button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {activeArticle ? (
                <motion.div
                  key={activeArticle.id}
                  initial={reduced ? false : fadeScale.initial}
                  animate={fadeScale.animate}
                  exit={reduced ? undefined : fadeScale.exit}
                  transition={transitions.enter}
                  className="p-6 rounded-2xl glass-container border border-border space-y-5"
                >
                  <div>
                    <div className="flex gap-2 items-center mb-2 flex-wrap">
                      <span className="text-[12px] uppercase font-mono tracking-wider text-sky-800 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                        {activeArticle.category}
                      </span>
                      <span className="text-[12px] text-fg-subtle font-mono">
                        Last Updated: {activeArticle.lastUpdated}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(activeArticle)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-2.5 py-1.5 text-[11px] font-mono text-fg-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label={`Edit ${activeArticle.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-fg tracking-tight">
                      {activeArticle.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {activeArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[12px] font-mono text-fg-muted bg-panel-elevated px-2 py-0.5 rounded border border-border"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-border pt-5">
                    <div
                      className="markdown-body text-xs sm:text-sm text-fg-muted leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(activeArticle.body) }}
                    />
                  </div>
                </motion.div>
              ) : (
                <EmptyState
                  icon={<Cpu className="w-8 h-8" />}
                  message="Select a technical article on the left to read content."
                />
              )}
            </AnimatePresence>
          </div>
        </div>

      <KbArticleModal
        open={modalOpen}
        item={editingItem}
        existingCategories={categoryExtras}
        onClose={closeModal}
        onSave={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
