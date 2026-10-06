import { ExternalLink, Link2, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { companymasterapp } from "../../types";
import { Popover } from "./Popover";
import { IconTooltip } from "./IconTooltip";
import { EmptyValue } from "./EmptyValue";

interface LinksPopoverProps {
  app: companymasterapp;
}

interface LinkGroupProps {
  title: string;
  urls: string[];
  raw?: string;
}

function LinkGroup({ title, urls, raw }: LinkGroupProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // ignore clipboard failures in restricted contexts
    }
  }

  return (
    <div>
      <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
        {title}
      </p>
      {urls.length === 0 ? (
        raw && raw.trim() ? (
          <p className="text-xs text-fg-muted">{raw}</p>
        ) : (
          <EmptyValue label="No link" />
        )
      ) : (
        <ul className="space-y-1.5">
          {urls.map((url) => (
            <li
              key={url}
              className="flex items-start gap-1.5 rounded-md bg-white/5 px-2 py-1.5"
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 break-all text-[11px] text-indigo-300 hover:text-indigo-200"
                onClick={(event) => event.stopPropagation()}
              >
                {url}
              </a>
              <IconTooltip label="Copy link">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void copy(url);
                  }}
                  className="shrink-0 rounded p-0.5 text-fg-muted hover:bg-white/10 hover:text-fg"
                >
                  {copied === url ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </IconTooltip>
              <IconTooltip label="Open link">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="shrink-0 rounded p-0.5 text-fg-muted hover:bg-white/10 hover:text-fg"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </IconTooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LinksPopover({ app }: LinksPopoverProps) {
  const count =
    app.marketingMaterial.length +
    app.androidClosedTesting.length +
    app.androidInternalTesting.length;

  return (
    <Popover
      title="Links"
      trigger={
        <IconTooltip label="Marketing & Android testing links">
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-white/5 px-1.5 py-1 text-fg-muted transition-colors hover:border-border-strong hover:bg-white/10">
            <Link2 className="h-3.5 w-3.5" />
            {count > 0 && (
              <span className="font-mono text-[9px] text-fg-muted">{count}</span>
            )}
          </span>
        </IconTooltip>
      }
    >
      <div className="space-y-3">
        <LinkGroup
          title="Marketing Material"
          urls={app.marketingMaterial}
          raw={app.marketingMaterialRaw}
        />
        <LinkGroup
          title="Android Closed Testing"
          urls={app.androidClosedTesting}
          raw={app.androidClosedTestingRaw}
        />
        <LinkGroup
          title="Android Internal Testing"
          urls={app.androidInternalTesting}
          raw={app.androidInternalTestingRaw}
        />
      </div>
    </Popover>
  );
}
