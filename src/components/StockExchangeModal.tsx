import { useEffect, useState, type FormEvent } from "react";
import type { StockExchangeLink } from "../types";
import { getCountryFlag, COUNTRY_FLAGS } from "../data/countryFlags";
import {
  ModalShell,
  fieldClass,
  labelClass,
} from "./modals";
import { GlassButton } from "./motion";

interface StockExchangeModalProps {
  open: boolean;
  item?: StockExchangeLink | null;
  onClose: () => void;
  onSave: (item: StockExchangeLink) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface FormState {
  country: string;
  city: string;
  exchange: string;
  code: string;
  flag: string;
  url: string;
  vpnRequired: boolean;
  note: string;
}

function blankForm(): FormState {
  return {
    country: "",
    city: "",
    exchange: "",
    code: "",
    flag: "",
    url: "",
    vpnRequired: false,
    note: "",
  };
}

function fromItem(item: StockExchangeLink): FormState {
  return {
    country: item.country,
    city: item.city,
    exchange: item.exchange,
    code: item.code ?? "",
    flag: item.flag ?? getCountryFlag(item.country),
    url: item.url,
    vpnRequired: item.vpnRequired,
    note: item.note,
  };
}

export function StockExchangeModal({
  open,
  item = null,
  onClose,
  onSave,
  onDelete,
}: StockExchangeModalProps) {
  const isEditing = Boolean(item);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(item ? fromItem(item) : blankForm());
    setError(null);
    setSaving(false);
    setDeleting(false);
  }, [open, item]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country" && typeof value === "string") {
        const resolved = getCountryFlag(value);
        if (resolved !== "\u{1F310}") next.flag = resolved;
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || deleting) return;

    const country = form.country.trim();
    const city = form.city.trim();
    const exchange = form.exchange.trim();
    const url = form.url.trim();
    if (!country || !city || !exchange || !url) {
      setError("Country, city, exchange, and URL are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: item?.id ?? `se-${Date.now()}`,
        country,
        city,
        exchange,
        code: form.code.trim().toUpperCase(),
        flag: form.flag || getCountryFlag(country),
        url,
        vpnRequired: form.vpnRequired,
        note: form.note.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item || !onDelete || saving || deleting) return;
    if (!confirm(`Remove ${item.exchange}?`)) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Delete failed. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      title={isEditing ? "Edit stock exchange" : "Add stock exchange"}
      description="Official exchange portals for Company global client markets."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="se-country" className={labelClass}>
              Country
            </label>
            <input
              id="se-country"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className={fieldClass}
              placeholder="United States"
              required
              disabled={saving || deleting}
            />
          </div>
          <div>
            <label htmlFor="se-city" className={labelClass}>
              City
            </label>
            <input
              id="se-city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className={fieldClass}
              placeholder="New York"
              required
              disabled={saving || deleting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="se-exchange" className={labelClass}>
            Exchange
          </label>
          <input
            id="se-exchange"
            value={form.exchange}
            onChange={(e) => updateField("exchange", e.target.value)}
            className={fieldClass}
            placeholder="NYSE"
            required
            disabled={saving || deleting}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="se-code" className={labelClass}>
              Exchange Code
            </label>
            <input
              id="se-code"
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
              className={fieldClass}
              placeholder="NYSE"
              disabled={saving || deleting}
            />
          </div>
          <div>
            <label htmlFor="se-flag" className={labelClass}>
              Flag {form.flag && <span className="ml-1 text-sm">{form.flag}</span>}
            </label>
            <select
              id="se-flag"
              value={form.flag}
              onChange={(e) => updateField("flag", e.target.value)}
              className={fieldClass}
              disabled={saving || deleting}
            >
              <option value="">Auto from country</option>
              {Object.entries(COUNTRY_FLAGS).map(([name, emoji]) => (
                <option key={name} value={emoji}>
                  {emoji} {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="se-url" className={labelClass}>
            URL
          </label>
          <input
            id="se-url"
            type="url"
            value={form.url}
            onChange={(e) => updateField("url", e.target.value)}
            className={fieldClass}
            placeholder="https://..."
            required
            disabled={saving || deleting}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
          <input
            type="checkbox"
            checked={form.vpnRequired}
            onChange={(e) => updateField("vpnRequired", e.target.checked)}
            className="rounded border-border-strong bg-panel-solid"
            disabled={saving || deleting}
          />
          VPN or restricted network access required
        </label>

        <div>
          <label htmlFor="se-note" className={labelClass}>
            Note
          </label>
          <textarea
            id="se-note"
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            className={`${fieldClass} min-h-[72px] resize-y`}
            placeholder="Optional access notes"
            disabled={saving || deleting}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="text-xs font-mono text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete exchange"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={saving || deleting}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add exchange"}
            </GlassButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
