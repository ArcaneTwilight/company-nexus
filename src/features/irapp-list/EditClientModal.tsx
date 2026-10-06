import { useEffect, useState, type FormEvent } from "react";
import type {
  FeatureTriState,
  HasChangesValue,
  companymasterapp,
  IRAppMasterStatusKey,
} from "../../types";
import { STATUS_LEGEND } from "./columnConfig";
import { ModalShell, ModalActions, fieldClass, labelClass } from "./ModalShell";
import { parseContactList, todayIsoDate } from "../../lib/companyAppFactory";
import { normalizeHasChanges } from "../../lib/companyAppNormalize";

interface EditClientModalProps {
  app: companymasterapp | null;
  open: boolean;
  onClose: () => void;
  onSave: (app: companymasterapp) => Promise<void>;
}

const FEATURE_OPTIONS: Array<{ value: FeatureTriState; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "partial", label: "Partial" },
  { value: "unknown", label: "Unknown" },
];

const HAS_CHANGES_OPTIONS: HasChangesValue[] = ["Yes", "No"];

function featureFromSelect(value: FeatureTriState) {
  const match = FEATURE_OPTIONS.find((option) => option.value === value);
  return {
    value,
    label: value === "unknown" ? "" : match?.label ?? "",
  };
}

export function EditClientModal({ app, open, onClose, onSave }: EditClientModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [statusKey, setStatusKey] = useState<IRAppMasterStatusKey>("new");
  const [liveVersion, setLiveVersion] = useState("");
  const [upgradeOrNewOrder, setUpgradeOrNewOrder] = useState("");
  const [country, setCountry] = useState("");
  const [market, setMarket] = useState("");
  const [stockExchange, setStockExchange] = useState("");
  const [hasChanges, setHasChanges] = useState<HasChangesValue>("No");
  const [comments, setComments] = useState("");
  const [salesPoc, setSalesPoc] = useState("");
  const [media, setMedia] = useState<FeatureTriState>("unknown");
  const [aiFeatures, setAiFeatures] = useState<FeatureTriState>("unknown");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!app || !open) return;
    setCompanyName(app.companyName);
    setStatusKey(app.statusKey);
    setLiveVersion(app.liveVersion);
    setUpgradeOrNewOrder(app.upgradeOrNewOrder);
    setCountry(app.country);
    setMarket(app.market);
    setStockExchange(app.stockExchange);
    setHasChanges(normalizeHasChanges(app.hasChanges));
    setComments(app.comments);
    setSalesPoc(app.salesOnboardingPoc.join(", ") || app.salesOnboardingPocRaw);
    setMedia(app.media?.value ?? "unknown");
    setAiFeatures(app.aiFeatures?.value ?? "unknown");
    setError(null);
    setSaving(false);
  }, [app, open]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!app || saving) return;
    const name = companyName.trim();
    if (!name) {
      setError("Company name is required.");
      return;
    }

    const statusMeta = STATUS_LEGEND.find((item) => item.key === statusKey);
    const contacts = parseContactList(salesPoc);

    const next: companymasterapp = {
      ...app,
      companyName: name,
      statusKey,
      statusLabel: statusMeta?.label ?? app.statusLabel,
      liveVersion: liveVersion.trim(),
      upgradeOrNewOrder: upgradeOrNewOrder.trim(),
      country: country.trim(),
      market: market.trim(),
      stockExchange: stockExchange.trim(),
      hasChanges,
      comments: comments.trim(),
      salesOnboardingPoc: contacts,
      salesOnboardingPocRaw: salesPoc.trim(),
      media: featureFromSelect(media),
      aiFeatures: featureFromSelect(aiFeatures),
      lastUpdated: todayIsoDate(),
    };

    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open={open && Boolean(app)}
      onClose={handleClose}
      title="Edit Company client"
      description="Update operational fields — comments are the quickest status summary for the team."
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="edit-company" className={labelClass}>
              Company Name
            </label>
            <input
              id="edit-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className={fieldClass}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-status" className={labelClass}>
              Status
            </label>
            <select
              id="edit-status"
              value={statusKey}
              onChange={(event) => setStatusKey(event.target.value as IRAppMasterStatusKey)}
              className={fieldClass}
            >
              {STATUS_LEGEND.filter((item) => item.key !== "unknown").map((item) => (
                <option key={item.key} value={item.key} className="bg-panel-solid">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-has-changes" className={labelClass}>
              Has changes
            </label>
            <select
              id="edit-has-changes"
              value={hasChanges}
              onChange={(event) =>
                setHasChanges(normalizeHasChanges(event.target.value))
              }
              className={fieldClass}
            >
              {HAS_CHANGES_OPTIONS.map((value) => (
                <option key={value} value={value} className="bg-panel-solid">
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-live" className={labelClass}>
              Live version
            </label>
            <input
              id="edit-live"
              value={liveVersion}
              onChange={(event) => setLiveVersion(event.target.value)}
              className={fieldClass}
              placeholder="e.g. V3"
            />
          </div>

          <div>
            <label htmlFor="edit-upgrade" className={labelClass}>
              Upgrade / New Order
            </label>
            <input
              id="edit-upgrade"
              value={upgradeOrNewOrder}
              onChange={(event) => setUpgradeOrNewOrder(event.target.value)}
              className={fieldClass}
              placeholder="e.g. New / from V2"
            />
          </div>

          <div>
            <label htmlFor="edit-country" className={labelClass}>
              Country
            </label>
            <input
              id="edit-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="edit-market" className={labelClass}>
              Market
            </label>
            <input
              id="edit-market"
              value={market}
              onChange={(event) => setMarket(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="edit-exchange" className={labelClass}>
              Stock Exchange
            </label>
            <input
              id="edit-exchange"
              value={stockExchange}
              onChange={(event) => setStockExchange(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="edit-media" className={labelClass}>
              Media
            </label>
            <select
              id="edit-media"
              value={media}
              onChange={(event) => setMedia(event.target.value as FeatureTriState)}
              className={fieldClass}
            >
              {FEATURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-panel-solid">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-ai" className={labelClass}>
              AI Features
            </label>
            <select
              id="edit-ai"
              value={aiFeatures}
              onChange={(event) => setAiFeatures(event.target.value as FeatureTriState)}
              className={fieldClass}
            >
              {FEATURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-panel-solid">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="edit-sales" className={labelClass}>
              Sales / Onboarding POC
            </label>
            <input
              id="edit-sales"
              value={salesPoc}
              onChange={(event) => setSalesPoc(event.target.value)}
              className={fieldClass}
              placeholder="Comma-separated names"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="edit-comments" className={labelClass}>
              Comments / Remarks
            </label>
            <textarea
              id="edit-comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              className={`${fieldClass} min-h-[7rem] resize-y`}
              placeholder="What’s happening / what’s pending…"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        <ModalActions
          onCancel={handleClose}
          submitLabel="Save changes"
          saving={saving}
          disabled={!companyName.trim()}
        />
      </form>
    </ModalShell>
  );
}
