import { useState, type FormEvent } from "react";
import { ModalShell, ModalActions, fieldClass, labelClass } from "./ModalShell";
import { createBlankcompanyApp } from "../../lib/companyAppFactory";
import type { companymasterapp } from "../../types";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (app: companymasterapp) => Promise<void>;
}

export function AddClientModal({ open, onClose, onSave }: AddClientModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCompanyName("");
    setCountry("");
    setError(null);
    setSaving(false);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = companyName.trim();
    const place = country.trim();
    if (!name || !place || saving) {
      setError("Company name and country are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(createBlankcompanyApp(name, place));
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client.");
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Add Company client"
      description="Create a new row with company name and country. Other fields can be filled in later."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="add-company" className={labelClass}>
            Company Name
          </label>
          <input
            id="add-company"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className={fieldClass}
            placeholder="e.g. Acme Holdings"
            autoFocus
            required
          />
        </div>
        <div>
          <label htmlFor="add-country" className={labelClass}>
            Country
          </label>
          <input
            id="add-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className={fieldClass}
            placeholder="e.g. Saudi Arabia"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <ModalActions
          onCancel={handleClose}
          submitLabel="Add client"
          saving={saving}
          disabled={!companyName.trim() || !country.trim()}
        />
      </form>
    </ModalShell>
  );
}
