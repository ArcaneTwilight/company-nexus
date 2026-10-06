import { useEffect, useMemo, useState } from "react";
import type { KnowledgeDoc, KnowledgeDomain } from "../types";
import { FileText, Plus, Pencil } from "lucide-react";
import { SearchInput } from "./SearchInput";
import { motion } from "motion/react";
import { EmptyState, GlassButton, FilterChip } from "./motion";
import { fadeScale, transitions } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { MarkdownViewer } from "./shared/MarkdownViewer";
import { KnowledgeDocModal } from "./KnowledgeDocModal";

interface KnowledgeDocsSectionProps {
  docs: KnowledgeDoc[];
  initialSearch?: string;
  onUpsert: (item: KnowledgeDoc) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const DOMAIN_FILTERS: Array<KnowledgeDomain | "All"> = [
  "All",
  "reports",
  "support",
  "developer",
  "clients",
  "team",
  "general",
];

export default function KnowledgeDocsSection({
  docs,
  initialSearch = "",
  onUpsert,
  onDelete,
}: KnowledgeDocsSectionProps) {
  const reduced = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [domain, setDomain] = useState<KnowledgeDomain | "All">("All");
  const [activeDoc, setActiveDoc] = useState<KnowledgeDoc | null>(
    docs.find((d) => !d.isArchived) ?? docs[0] ?? null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeDoc | null>(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return docs.filter((d) => {
      if (domain !== "All" && d.domain !== domain) return false;
      if (!q) return true;
      const blob = [d.title, d.summary, d.body, ...d.tags].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [docs, searchTerm, domain]);

  useEffect(() => {
    if (!activeDoc && filtered.length > 0) setActiveDoc(filtered[0]);
    if (activeDoc && !docs.some((d) => d.id === activeDoc.id)) {
      setActiveDoc(filtered[0] ?? null);
    }
  }, [filtered, docs, activeDoc]);

  function openCreate() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item: KnowledgeDoc) {
    setEditingItem(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Knowledge Docs
          </h2>
          <p className="text-[13px] text-fg-muted mt-1 max-w-xl">
            Paste Markdown reports and long-form docs. The AI reads registry summaries first, then
            sections — not full files unless needed.
          </p>
        </div>
        <GlassButton type="button" onClick={openCreate} className="inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Markdown
        </GlassButton>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="w-full md:w-80">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search knowledge docs…"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DOMAIN_FILTERS.map((d) => (
            <span key={d}>
              <FilterChip
                active={domain === d}
                onClick={() => setDomain(d)}
                label={d === "All" ? "All" : d}
              />
            </span>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            message="No knowledge docs yet. Add Markdown reports for the AI registry."
          />
          <div className="flex justify-center">
            <GlassButton type="button" onClick={openCreate}>
              Add first doc
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[420px]">
          <div className="lg:col-span-4 space-y-2 max-h-[560px] overflow-y-auto">
            {filtered.map((doc) => (
              <motion.button
                key={doc.id}
                type="button"
                initial={reduced ? false : fadeScale.initial}
                animate={fadeScale.animate}
                transition={transitions.enter}
                onClick={() => setActiveDoc(doc)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  activeDoc?.id === doc.id
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-border bg-panel hover:border-border-strong"
                }`}
              >
                <p className="text-[13px] font-medium text-fg truncate">{doc.title}</p>
                <p className="text-[11px] text-fg-subtle mt-0.5">
                  {doc.domain}
                  {doc.isArchived ? " · archived" : ""} · v{doc.contentVersion}
                </p>
              </motion.button>
            ))}
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-border bg-panel p-4 min-h-[320px]">
            {activeDoc ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-fg">{activeDoc.title}</h3>
                    <p className="text-[12px] text-fg-subtle mt-1">
                      {activeDoc.summary || "No summary"}
                    </p>
                    {activeDoc.outline && activeDoc.outline.length > 0 && (
                      <p className="text-[11px] text-fg-subtle mt-1 font-mono">
                        Outline: {activeDoc.outline.map((o) => o.heading).join(" · ")}
                      </p>
                    )}
                  </div>
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => openEdit(activeDoc)}
                    className="inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </GlassButton>
                </div>
                <div className="max-h-[480px] overflow-y-auto pr-1">
                  <MarkdownViewer markdown={activeDoc.body} className="text-[13px]" />
                </div>
              </>
            ) : (
              <p className="text-fg-subtle text-sm">Select a document</p>
            )}
          </div>
        </div>
      )}

      <KnowledgeDocModal
        open={modalOpen}
        item={editingItem}
        onClose={() => setModalOpen(false)}
        onSave={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
