import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ExternalLink, Pencil } from "lucide-react";
import type { companymasterapp } from "../../types";
import { transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { todayIsoDate } from "../../lib/companyAppFactory";
import { StatusPill } from "./StatusPill";
import { FeatureIndicator } from "./FeatureIndicator";
import { EmptyValue, displayOrDash } from "./EmptyValue";
import { GlassButton } from "../../components/motion";
import { fieldClass } from "./ModalShell";

interface ClientDetailDrawerProps {
  app: companymasterapp | null;
  onClose: () => void;
  onEdit?: (app: companymasterapp) => void;
  onSave?: (app: companymasterapp) => Promise<void>;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-border py-2.5 last:border-0">
      <dt className="pt-0.5 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

function TextOrEmpty({ value, empty = "—" }: { value: string; empty?: string }) {
  const shown = displayOrDash(value);
  return shown ? <>{shown}</> : <EmptyValue label={empty} />;
}

function LinkList({ urls, raw }: { urls: string[]; raw?: string }) {
  if (urls.length === 0) {
    if (raw?.trim()) return <p className="whitespace-pre-wrap text-xs text-fg-muted">{raw}</p>;
    return <EmptyValue label="No link" />;
  }
  return (
    <ul className="space-y-1.5">
      {urls.map((url) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-1 break-all text-xs text-indigo-300 hover:text-indigo-200"
          >
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
}

function ContactList({ names }: { names: string[] }) {
  if (names.length === 0) return <EmptyValue label="Unassigned" />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <span
          key={name}
          className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-xs text-fg"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export function ClientDetailDrawer({
  app,
  onClose,
  onEdit,
  onSave,
}: ClientDetailDrawerProps) {
  const reduced = useReducedMotion();
  const [editingComments, setEditingComments] = useState(false);
  const [commentsDraft, setCommentsDraft] = useState("");
  const [savingComments, setSavingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!app) return;
    setEditingComments(false);
    setCommentsDraft(app.comments);
    setCommentError(null);
    setSavingComments(false);
  }, [app]);

  useEffect(() => {
    if (!app) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [app, onClose]);

  async function saveComments() {
    if (!app || !onSave || savingComments) return;
    setSavingComments(true);
    setCommentError(null);
    try {
      await onSave({
        ...app,
        comments: commentsDraft.trim(),
        lastUpdated: todayIsoDate(),
      });
      setEditingComments(false);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to save comments.");
    } finally {
      setSavingComments(false);
    }
  }

  return (
    <AnimatePresence>
      {app && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <motion.button
            type="button"
            aria-label="Close details"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={transitions.exit}
            className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="irapp-detail-title"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: "100%" }}
            transition={transitions.enter}
            className="glass-container relative z-10 flex h-full w-full max-w-md flex-col border-l border-border shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
                  App details
                </p>
                <h3
                  id="irapp-detail-title"
                  className="mt-1 truncate font-display text-lg font-semibold text-fg"
                >
                  {app.companyName}
                </h3>
                <div className="mt-2">
                  <StatusPill statusKey={app.statusKey} label={app.statusLabel} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {onEdit && (
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-2"
                    onClick={() => onEdit(app)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </GlassButton>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border bg-white/5 p-2 text-fg-muted transition-colors hover:bg-white/10 hover:text-fg"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-300/80">
                    Comments / Remarks
                  </p>
                  {onSave && !editingComments && (
                    <button
                      type="button"
                      onClick={() => {
                        setCommentsDraft(app.comments);
                        setEditingComments(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                </div>

                {editingComments ? (
                  <div className="space-y-2">
                    <textarea
                      value={commentsDraft}
                      onChange={(event) => setCommentsDraft(event.target.value)}
                      className={`${fieldClass} min-h-[6.5rem] resize-y bg-panel`}
                      placeholder="What’s happening / what’s pending…"
                    />
                    {commentError && (
                      <p className="text-xs text-rose-700 dark:text-rose-300">{commentError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <GlassButton
                        type="button"
                        variant="ghost"
                        disabled={savingComments}
                        onClick={() => {
                          setEditingComments(false);
                          setCommentsDraft(app.comments);
                          setCommentError(null);
                        }}
                      >
                        Cancel
                      </GlassButton>
                      <GlassButton
                        type="button"
                        variant="primary"
                        disabled={savingComments}
                        onClick={() => void saveComments()}
                      >
                        {savingComments ? "Saving…" : "Save comments"}
                      </GlassButton>
                    </div>
                  </div>
                ) : app.comments ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
                    {app.comments}
                  </p>
                ) : (
                  <p className="text-sm text-fg-subtle">No comments yet.</p>
                )}
              </div>

              <dl>
                <DetailRow label="Live version">
                  <TextOrEmpty value={app.liveVersion} />
                </DetailRow>
                <DetailRow label="Has changes">
                  <span className="text-xs font-mono text-fg-muted">
                    {app.hasChanges === "Yes" ? "Yes" : "No"}
                  </span>
                </DetailRow>
                <DetailRow label="Upgrade / New">
                  <TextOrEmpty value={app.upgradeOrNewOrder} />
                </DetailRow>
                <DetailRow label="Initial Release">
                  <TextOrEmpty value={app.initialReleaseDate} />
                </DetailRow>
                <DetailRow label="Date ordered">
                  <TextOrEmpty value={app.dateOrdered} />
                </DetailRow>
                <DetailRow label="Last Updated">
                  <TextOrEmpty value={app.lastUpdated} />
                </DetailRow>
                <DetailRow label="Country">
                  <TextOrEmpty value={app.country} empty="—" />
                </DetailRow>
                <DetailRow label="Market">
                  <TextOrEmpty value={app.market} />
                </DetailRow>
                <DetailRow label="Stock Exchange">
                  <TextOrEmpty value={app.stockExchange} />
                </DetailRow>
                <DetailRow label="Features">
                  <div className="flex items-center gap-2">
                    <FeatureIndicator kind="media" feature={app.media} />
                    <FeatureIndicator kind="aiFeatures" feature={app.aiFeatures} />
                  </div>
                </DetailRow>
                <DetailRow label="Push Notif.">
                  <TextOrEmpty value={app.pushNotification} />
                </DetailRow>
                <DetailRow label="Initial iOS">
                  <TextOrEmpty value={app.initialIosRelease} />
                </DetailRow>
                <DetailRow label="Initial Android">
                  <TextOrEmpty value={app.initialAndroidRelease} />
                </DetailRow>
                <DetailRow label="Days Completed">
                  <TextOrEmpty value={app.daysCompleted} />
                </DetailRow>
                <DetailRow label="Sales POC">
                  <ContactList names={app.salesOnboardingPoc} />
                </DetailRow>
                <DetailRow label="App Support POC">
                  <ContactList names={app.pssPoc} />
                </DetailRow>
                <DetailRow label="Dev POC">
                  <ContactList names={app.devPoc} />
                </DetailRow>
                <DetailRow label="Marketing">
                  <LinkList urls={app.marketingMaterial} raw={app.marketingMaterialRaw} />
                </DetailRow>
                <DetailRow label="Closed Testing">
                  <LinkList
                    urls={app.androidClosedTesting}
                    raw={app.androidClosedTestingRaw}
                  />
                </DetailRow>
                <DetailRow label="Internal Testing">
                  <LinkList
                    urls={app.androidInternalTesting}
                    raw={app.androidInternalTestingRaw}
                  />
                </DetailRow>
              </dl>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
