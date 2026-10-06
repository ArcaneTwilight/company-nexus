import { useState, useEffect, Fragment } from "react";
import { AIUtilityItem, AIUtilityCategory } from "../types";
import {
  Bot,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Wrench,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { SearchInput } from "./SearchInput";
import { LayoutGroup, motion } from "motion/react";
import { GlassCard, FilterChip, EmptyState, StaggerGrid, StaggerItem } from "./motion";
import { durations } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AIUtilitiesSectionProps {
  items: AIUtilityItem[];
  initialSearch?: string;
}

const CATEGORY_ICONS: Record<AIUtilityCategory, typeof Bot> = {
  Tool: Wrench,
  "Prompt Template": FileText,
  Guide: BookOpen,
};

const CATEGORY_COLORS: Record<AIUtilityCategory, string> = {
  Tool: "text-sky-800 dark:text-sky-300 bg-sky-500/10 border-sky-500/20",
  "Prompt Template": "text-purple-800 dark:text-purple-300 bg-purple-500/10 border-purple-500/20",
  Guide: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
};

export default function AIUtilitiesSection({
  items,
  initialSearch = "",
}: AIUtilitiesSectionProps) {
  const reduced = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<AIUtilityCategory | "All">("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const categories: Array<AIUtilityCategory | "All"> = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];

  const filteredItems = items.filter((item) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.content && item.content.toLowerCase().includes(query));
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-panel p-4 rounded-xl border border-border">
        <div className="w-full md:w-80">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search AI tools, templates, and guides..."
          />
        </div>

        <LayoutGroup>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <Bot className="w-4 h-4 text-fg-muted shrink-0" />
            {categories.map((cat) => (
              <Fragment key={cat}>
                <FilterChip
                  label={cat}
                  active={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                />
              </Fragment>
            ))}
          </div>
        </LayoutGroup>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          message="No AI utilities found matching search parameters."
        />
      ) : (
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item, index) => {
            const Icon = CATEGORY_ICONS[item.category];
            const colorClass = CATEGORY_COLORS[item.category];

            return (
              <Fragment key={item.id}>
                <StaggerItem>
                  <GlassCard layout index={index} className="p-5 flex flex-col group h-full">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider border uppercase shrink-0 flex items-center gap-1.5 ${colorClass}`}
                      >
                        <Icon className="w-3 h-3" />
                        {item.category}
                      </span>
                      <span className="text-[11px] text-fg-subtle font-mono">
                        Updated: {item.lastUpdated}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-display text-fg group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-fg-muted leading-relaxed mt-2 font-sans font-light">
                      {item.description}
                    </p>

                    {item.content && (
                      <div className="mt-4 p-3 rounded-lg bg-panel-solid border border-border">
                        <pre className="text-[11px] text-fg-muted font-mono whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </pre>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                      {item.url && (
                        <motion.a
                          href={item.url}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-500 hover:text-white transition-colors flex items-center gap-1.5 glass-button cursor-pointer"
                          whileHover={reduced ? undefined : { y: -1 }}
                          whileTap={reduced ? undefined : { scale: 0.97 }}
                          transition={{ duration: durations.fast }}
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </motion.a>
                      )}
                      {item.content && (
                        <motion.button
                          type="button"
                          onClick={() => handleCopy(item.id, item.content!)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-border text-fg-muted text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                          whileHover={reduced ? undefined : { y: -1 }}
                          whileTap={reduced ? undefined : { scale: 0.97 }}
                          transition={{ duration: durations.fast }}
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </GlassCard>
                </StaggerItem>
              </Fragment>
            );
          })}
        </StaggerGrid>
      )}
    </div>
  );
}
