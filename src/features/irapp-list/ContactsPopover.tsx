import { Users } from "lucide-react";
import { Popover } from "./Popover";
import { IconTooltip } from "./IconTooltip";
import { EmptyValue } from "./EmptyValue";

interface ContactsPopoverProps {
  sales: string[];
  pss: string[];
  dev: string[];
  /** Icon-only trigger for dense table action cells */
  compact?: boolean;
}

function ContactGroup({ title, names }: { title: string; names: string[] }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
        {title}
      </p>
      {names.length === 0 ? (
        <EmptyValue label="Unassigned" />
      ) : (
        <ul className="space-y-1">
          {names.map((name) => (
            <li
              key={`${title}-${name}`}
              className="rounded-md bg-white/5 px-2 py-1 text-xs text-fg"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ContactsPopover({
  sales,
  pss,
  dev,
  compact = false,
}: ContactsPopoverProps) {
  const total = sales.length + pss.length + dev.length;
  const preview = sales[0] || pss[0] || dev[0];

  return (
    <Popover
      title="Contacts"
      align="left"
      trigger={
        <IconTooltip label="View Sales, App Support, and Dev POCs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] text-fg-muted transition-colors hover:border-border-strong hover:bg-white/10">
            <Users className="h-3 w-3 text-fg-muted" />
            {compact ? (
              <span className="font-mono text-[9px] text-fg-muted">{total}</span>
            ) : total === 0 ? (
              <span className="text-fg-subtle">Unassigned</span>
            ) : (
              <span className="max-w-[5.5rem] truncate">{preview}</span>
            )}
            {!compact && total > 1 && (
              <span className="rounded bg-white/10 px-1 font-mono text-[9px] text-fg-muted">
                +{total - 1}
              </span>
            )}
          </span>
        </IconTooltip>
      }
    >
      <div className="space-y-3">
        <ContactGroup title="Sales / Onboarding POC" names={sales} />
        <ContactGroup title="App Support POC" names={pss} />
        <ContactGroup title="Dev POC" names={dev} />
      </div>
    </Popover>
  );
}
