import { useState, FormEvent } from "react";
import { Bot, Send, Trash2, User } from "lucide-react";
import type { AgentMode, ChatMessage, KnowledgeMode } from "../types";
import type { NexusRepositoryActions } from "../services/nexusRepository";
import {
  applyConfirmLocally,
  callAgent,
  confirmProposal,
} from "../lib/agentApi";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { transitions } from "../lib/motion";
import { renderLightMarkdown } from "../lib/lightMarkdown";
import { motion } from "motion/react";
import { ProposalCard } from "../features/ai/ProposalCard";

interface AgentChatProps {
  mode: AgentMode;
  welcome: string;
  placeholder?: string;
  /** Required for write-mode confirm → apply */
  actions?: NexusRepositoryActions;
  /** Allow toggling write mode from hub chat */
  allowWriteToggle?: boolean;
  /** Show knowledge domain chips */
  showKnowledgeModes?: boolean;
  /** Initial knowledge routing mode */
  initialKnowledgeMode?: KnowledgeMode;
  /** Optional class for the outer chat shell */
  className?: string;
}

const KNOWLEDGE_MODE_OPTIONS: Array<{ id: KnowledgeMode; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "general", label: "General" },
  { id: "support", label: "Support" },
  { id: "developer", label: "Developer" },
  { id: "clients", label: "Client Lists" },
  { id: "team", label: "Team" },
  { id: "reports", label: "Reports" },
];

function formatMessageTime(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AgentChat({
  mode: initialMode,
  welcome,
  placeholder = "Ask the Nexus agent…",
  actions,
  allowWriteToggle = false,
  showKnowledgeModes = false,
  initialKnowledgeMode = "auto",
  className = "h-[min(640px,70vh)]",
}: AgentChatProps) {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeMode>(initialKnowledgeMode);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: welcome,
      timestamp: formatMessageTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: formatMessageTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await callAgent({
        message: userMsg.content,
        history,
        mode,
        knowledgeMode,
      });

      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply!,
            timestamp: formatMessageTime(),
            proposals: data.proposals?.filter((p) => p.status === "pending"),
            toolsUsed: data.toolsUsed,
            citations: data.citations,
          },
        ]);
      } else {
        const retryHint =
          typeof data.retryAfterSec === "number"
            ? ` Try again in about ${data.retryAfterSec}s.`
            : "";
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `${data.error || "Failed to get an answer."}${retryHint} For quick lookups, use the header search instead.`,
            timestamp: formatMessageTime(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Network request failed. Ensure the dev server or Vercel /api/agent is running.",
          timestamp: formatMessageTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecide(proposalId: string, decision: "confirm" | "reject") {
    setConfirmBusy(true);
    try {
      const result = await confirmProposal(proposalId, decision);
      if (!result.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Could not ${decision} proposal: ${result.error}`,
            timestamp: formatMessageTime(),
          },
        ]);
        return;
      }

      if (decision === "confirm" && actions && result.proposal) {
        await applyConfirmLocally(
          {
            success: true,
            proposal: result.proposal,
            applyPayload: result.applyPayload ?? {
              collection: result.proposal.collection,
              action: result.proposal.action,
              documentId: result.proposal.documentId,
              document: result.proposal.after,
            },
          },
          actions
        );
      }

      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          proposals: m.proposals?.map((p) =>
            p.id === proposalId
              ? { ...p, status: decision === "confirm" ? "confirmed" : "rejected" }
              : p
          ),
        }))
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `status-${Date.now()}`,
          role: "assistant",
          content:
            decision === "confirm"
              ? `Saved. Proposal **${proposalId}** was confirmed and applied.`
              : `Rejected. Proposal **${proposalId}** was discarded — nothing was written.`,
          timestamp: formatMessageTime(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Failed to process confirmation. Check network and auth.",
          timestamp: formatMessageTime(),
        },
      ]);
    } finally {
      setConfirmBusy(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "Chat cleared. How can I help?",
        timestamp: formatMessageTime(),
      },
    ]);
  }

  return (
    <div className={`flex flex-col rounded-2xl border border-border bg-panel overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-panel">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
          <span className="text-[13px] text-fg-muted truncate">
            Nexus Agent · <span className="font-mono text-sky-700 dark:text-sky-300">{mode}</span>
            {showKnowledgeModes && (
              <>
                {" "}
                · <span className="font-mono text-emerald-700 dark:text-emerald-300/90">{knowledgeMode}</span>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {allowWriteToggle && (
            <button
              type="button"
              onClick={() => setMode((m) => (m === "write" ? "hub" : "write"))}
              className={`text-[11px] px-2 py-1 rounded-lg border ${
                mode === "write"
                  ? "border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/10"
                  : "border-border text-fg-muted hover:text-fg"
              }`}
            >
              {mode === "write" ? "Writes on" : "Enable writes"}
            </button>
          )}
          <button
            type="button"
            onClick={clearChat}
            className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-panel"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showKnowledgeModes && (
        <div className="px-3 py-2 border-b border-border bg-panel space-y-2">
          <p className="text-[10px] text-fg-subtle leading-snug">
            Pick a domain when you can — narrower mode uses fewer tokens and stays under free-tier limits.
          </p>
          <div className="flex gap-1.5 overflow-x-auto">
          {KNOWLEDGE_MODE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setKnowledgeMode(opt.id)}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                knowledgeMode === opt.id
                  ? "border-sky-500/40 text-sky-800 dark:text-sky-200 bg-sky-500/10"
                  : "border-border text-fg-subtle hover:text-fg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.enter}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-sky-600/80 text-white"
                  : "bg-panel-solid border border-border text-fg"
              }`}
            >
              <div
                className="agent-md [&_strong]:font-semibold [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-panel [&_code]:px-1 [&_code]:rounded [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h3]:text-[13px] [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc"
                dangerouslySetInnerHTML={{ __html: renderLightMarkdown(msg.content) }}
              />
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
                    Sources
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-fg-muted">
                    {Array.from(new Map(msg.citations.map((citation) => [
                      `${citation.sourceCollection}/${citation.sourceDocId}`,
                      citation,
                    ])).values()).map((citation) => (
                      <li key={`${citation.sourceCollection}/${citation.sourceDocId}`}>
                        {citation.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <p className="mt-2 text-[10px] text-fg-subtle font-mono">
                  {msg.toolsUsed.includes("answer_cache") ? "cached · " : ""}
                  tools: {msg.toolsUsed.filter((t) => t !== "answer_cache").join(", ") || "none"}
                </p>
              )}
              {msg.proposals?.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  busy={confirmBusy}
                  onDecide={handleDecide}
                />
              ))}
              <p className="mt-1.5 text-[10px] text-fg-subtle">{msg.timestamp}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-panel-elevated flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-fg-muted" />
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-fg-subtle">
            <Bot className="w-4 h-4 animate-pulse text-sky-700 dark:text-sky-400" />
            Thinking with tools…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 border-t border-border bg-panel flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 bg-panel border border-border rounded-xl px-3 py-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-sky-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
