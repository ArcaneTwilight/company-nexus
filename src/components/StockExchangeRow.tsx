import { ShieldAlert, Pencil } from "lucide-react";
import type { StockExchangeLink } from "../types";
import {
  countryFlagEmoji,
  extractExchangeAcronym,
  exchangeDisplayName,
  formatExchangeLocation,
} from "../lib/stockExchange";

interface StockExchangeRowProps {
  item: StockExchangeLink;
  onEdit: (item: StockExchangeLink) => void;
}

export function StockExchangeRow({ item, onEdit }: StockExchangeRowProps) {
  const acronym = item.code || extractExchangeAcronym(item.exchange);
  const displayName = exchangeDisplayName(item.exchange);
  const location = formatExchangeLocation(item.city, item.country);
  const title = item.vpnRequired
    ? item.note || "VPN or restricted network access required"
    : item.exchange;

  return (
    <div
      className={`group/row relative flex items-center min-w-0 rounded-lg border transition-all duration-200 ${
        item.vpnRequired
          ? "border-amber-500/20 hover:border-amber-500/35"
          : "border-border hover:border-sky-400/25"
      }`}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        className="flex flex-1 flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0 max-h-10 py-1.5 px-2 sm:px-2.5 rounded-lg bg-panel hover:bg-panel-elevated transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 overflow-hidden"
      >
        <span className="text-sm leading-none shrink-0" aria-hidden>
          {item.flag || countryFlagEmoji(item.country)}
        </span>

        <span className="text-[11px] text-fg-subtle truncate shrink min-w-0 max-w-[4.5rem] sm:max-w-[6.5rem] md:max-w-[8rem] lg:max-w-none whitespace-nowrap">
          {location}
        </span>

        <span className="w-px h-3.5 bg-white/10 shrink-0" aria-hidden />

        {item.vpnRequired && (
          <ShieldAlert
            className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0"
            strokeWidth={2}
            aria-label="VPN or restricted network access required"
          />
        )}

        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
          {acronym}
        </span>

        <span className="flex-1 min-w-0 text-[12px] font-medium text-fg truncate hidden lg:block group-hover/row:text-sky-100 transition-colors">
          {displayName}
        </span>

        <span
          className="shrink-0 text-[11px] text-fg-subtle group-hover/row:text-sky-400 transition-colors leading-none pr-0.5"
          aria-hidden
        >
          ↗
        </span>
      </a>

      <button
        type="button"
        onClick={() => onEdit(item)}
        className="absolute right-6 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-fg hover:bg-white/10 transition-all duration-200 cursor-pointer z-10"
        aria-label={`Edit ${item.exchange}`}
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}
