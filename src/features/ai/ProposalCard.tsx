import type { FC } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import type { AgentProposal } from "../../types";

interface ProposalCardProps {
  proposal: AgentProposal;
  busy: boolean;
  onDecide: (id: string, decision: "confirm" | "reject") => void;
}

export const ProposalCard: FC<ProposalCardProps> = ({ proposal, busy, onDecide }) => {
  const pending = proposal.status === "pending";
  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-left">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
            Write proposal · {proposal.action} · {proposal.collection}
          </p>
          <p className="text-[13px] text-fg">{proposal.summary}</p>
          <p className="text-[11px] text-fg-subtle font-mono truncate">
            id: {proposal.documentId}
          </p>
          {proposal.status !== "pending" && (
            <p className="text-[12px] text-fg-muted">Status: {proposal.status}</p>
          )}
          {pending && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onDecide(proposal.id, "confirm")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[12px] font-medium disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm save
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDecide(proposal.id, "reject")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-elevated hover:bg-panel text-fg text-[12px] font-medium disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
