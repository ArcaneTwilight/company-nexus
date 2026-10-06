import { useState } from "react";
import type { TeamMember } from "../../types";
import { Check, Clock, Copy, MessageSquare, Pencil } from "lucide-react";
import { AnimatedTime, GlassCard } from "../../components/motion";
import { IconTooltip } from "../../components/shared";
import { Popover } from "../irapp-list/Popover";
import { formatLocalTime, resolveTimezoneId } from "../../lib/teamDirectory";

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  now: Date;
  onEdit: (member: TeamMember) => void;
}

const pillClass =
  "inline-flex items-center justify-center rounded-full border border-border bg-white/5 p-1.5 text-fg-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer";

export function TeamMemberCard({ member, index, now, onEdit }: TeamMemberCardProps) {
  const [copied, setCopied] = useState(false);
  const timezoneId = resolveTimezoneId(member.timezoneId, member.timezone);
  const localTime = formatLocalTime(now, timezoneId);
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const hasNotes = Boolean(member.contactNotes?.trim());

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(member.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore clipboard failures in restricted contexts
    }
  }

  return (
    <GlassCard index={index} className="p-3 flex flex-col group h-full">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/20 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
            {initials}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold font-display text-fg group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors truncate leading-tight">
            {member.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-fg-muted min-w-0">
            <Clock className="w-3 h-3 text-fg-subtle shrink-0" />
            <span className="font-mono truncate">{member.timezone}</span>
            <span className="text-fg-subtle">·</span>
            <AnimatedTime
              time={localTime}
              className="font-mono font-semibold text-sky-700 dark:text-sky-300 shrink-0"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(member)}
          className="shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-white/5 p-1.5 text-fg-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={`Edit ${member.name}`}
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 min-w-0">
        <a
          href={`mailto:${member.email}`}
          className="min-w-0 flex-1 truncate text-[11px] text-fg-muted hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          title={member.email}
        >
          {member.email}
        </a>
        <div className="flex items-center gap-1 shrink-0">
          <IconTooltip label={copied ? "Copied" : "Copy email"}>
            <button
              type="button"
              onClick={() => void copyEmail()}
              className={pillClass}
              aria-label={copied ? "Email copied" : `Copy ${member.email}`}
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </IconTooltip>
          {hasNotes ? (
            <Popover
              align="right"
              title="Contact notes"
              trigger={
                <span className={pillClass} aria-label={`Notes for ${member.name}`}>
                  <MessageSquare className="w-3 h-3" />
                </span>
              }
            >
              <p className="text-xs text-fg-muted leading-relaxed font-sans font-light">
                {member.contactNotes}
              </p>
            </Popover>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
