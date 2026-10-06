import { useMemo, useState } from "react";
import { FAQItem } from "../types";
import { ChevronDown, HelpCircle, Plus, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { EmptyState, AccordionPanel, GlassButton } from "./motion";
import { SectionToolbar } from "./shared";
import { transitions } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useSyncedSearch } from "../hooks/useSyncedSearch";
import { useEntityModal } from "../hooks/useEntityModal";
import { useCategoryFilter } from "../hooks/useCategoryFilter";
import { FaqModal } from "./FaqModal";

interface FAQSectionProps {
  faqs: FAQItem[];
  initialSearch?: string;
  onUpsert: (item: FAQItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function FAQSection({
  faqs,
  initialSearch = "",
  onUpsert,
  onDelete,
}: FAQSectionProps) {
  const reduced = useReducedMotion();
  const [searchTerm, setSearchTerm] = useSyncedSearch(initialSearch);
  const { selectedCategory, setSelectedCategory, categories, matchesCategory } =
    useCategoryFilter(faqs, (faq) => faq.category, {
      exclude: (faq) => faq.isArchived,
    });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { open, editingItem, openCreate, openEdit, close } = useEntityModal<FAQItem>();

  const categoryExtras = useMemo(() => faqs.map((f) => f.category), [faqs]);
  const query = searchTerm.toLowerCase();
  const filteredFaqs = faqs.filter((faq) => {
    if (faq.isArchived) return false;
    const matchesSearch =
      faq.title.toLowerCase().includes(query) ||
      faq.body.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query) ||
      faq.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesSearch && matchesCategory(faq);
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          onClick={openCreate}
          iconRight={<Plus className="w-4 h-4" />}
        >
          Add FAQ
        </GlassButton>
      </div>

      <div className="space-y-5">
        <SectionToolbar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search FAQ titles, bodies, tags..."
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
          {filteredFaqs.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-8 h-8" />}
              message="No FAQ records matches current criteria."
            />
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    layout
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transitions.enter, delay: reduced ? 0 : index * 0.04 }}
                    className="rounded-xl bg-panel border border-border overflow-hidden transition-colors hover:border-border"
                  >
                    <div className="flex items-stretch">
                      <button
                        onClick={() => toggleExpand(faq.id)}
                        className="flex-1 p-4 text-left flex justify-between items-center gap-4 hover:bg-panel transition-colors"
                      >
                        <div>
                          <div className="flex gap-2 items-center mb-1">
                            <span className="text-[12px] uppercase font-mono tracking-wider text-sky-800 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                              {faq.category}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-semibold text-fg tracking-tight leading-snug">
                            {faq.title}
                          </h4>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={transitions.accordion}
                          className="text-fg-muted hover:text-fg shrink-0"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(faq)}
                        className="px-3 border-l border-border text-fg-muted hover:text-fg hover:bg-white/5 transition-colors cursor-pointer"
                        aria-label={`Edit ${faq.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <AccordionPanel className="border-t border-border bg-panel">
                          <div className="p-4 space-y-4">
                            <p className="text-xs sm:text-sm text-fg-muted leading-relaxed whitespace-pre-line font-sans font-light">
                              {faq.body}
                            </p>

                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {faq.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[12px] font-mono text-fg-muted bg-panel-elevated px-2 py-0.5 rounded border border-border"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            <div className="text-[12px] text-fg-subtle font-mono flex items-center gap-1.5">
                              <span>Modified: {faq.lastUpdated}</span>
                            </div>
                          </div>
                        </AccordionPanel>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      <FaqModal
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
