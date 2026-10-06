import { useEffect, useState } from "react";
import { Link2, Link2Off } from "lucide-react";
import {
  ModalActions,
  ModalShell,
  fieldClass,
  labelClass,
} from "../../components/modals/ModalShell";
import type { companymasterapp, ReportTrackerEntry } from "../../types";

interface EditEntryModalProps {
  open: boolean;
  entry: ReportTrackerEntry | null;
  linkedApp?: companymasterapp;
  onClose: () => void;
  onSave: (patch: {
    appName: string;
    companyCode: string;
    stockExchange: string;
  }) => void;
}

export function EditEntryModal({
  open,
  entry,
  linkedApp,
  onClose,
  onSave,
}: EditEntryModalProps) {
  const [appName, setAppName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [stockExchange, setStockExchange] = useState("");

  useEffect(() => {
    if (!open || !entry) return;
    setAppName(entry.appName);
    setCompanyCode(entry.companyCode);
    setStockExchange(entry.stockExchange);
  }, [open, entry]);

  if (!entry) return null;

  return (
    <ModalShell
      open={open}
      title="Edit report entry"
      description="Update app identity fields. Other reports are edited from the table."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!appName.trim()) return;
          onSave({
            appName: appName.trim(),
            companyCode: companyCode.trim(),
            stockExchange: stockExchange.trim(),
          });
          onClose();
        }}
      >
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-border bg-panel-solid/50 px-3 py-2.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
              Linked Company client
            </p>
            {linkedApp ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-fg">
                <Link2 className="h-4 w-4 shrink-0 text-sky-500" />
                <span className="min-w-0 truncate">{linkedApp.companyName}</span>
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-sm text-fg-subtle">
                <Link2Off className="h-4 w-4 shrink-0 opacity-60" />
                Not linked to an Company client
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="rt-app-name">
              App
            </label>
            <input
              id="rt-app-name"
              value={appName}
              onChange={(event) => setAppName(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="rt-company-code">
              Company Code
            </label>
            <input
              id="rt-company-code"
              value={companyCode}
              onChange={(event) => setCompanyCode(event.target.value)}
              className={fieldClass}
              placeholder="e.g. AE-DRIVE"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="rt-stock-exchange">
              Stock Exchange / Name
            </label>
            <input
              id="rt-stock-exchange"
              value={stockExchange}
              onChange={(event) => setStockExchange(event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="border-t border-border px-5 py-3">
          <ModalActions
            onCancel={onClose}
            submitLabel="Save"
            disabled={!appName.trim()}
          />
        </div>
      </form>
    </ModalShell>
  );
}
