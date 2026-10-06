import { useCallback, useEffect, useState } from "react";

interface UseModalFormOptions<TForm> {
  open: boolean;
  item: unknown | null | undefined;
  blankForm: () => TForm;
  fromItem: (item: NonNullable<unknown>) => TForm;
}

/** Shared save/delete/error state for entity modals. */
export function useModalForm<TForm>({
  open,
  item,
  blankForm,
  fromItem,
}: UseModalFormOptions<TForm>) {
  const [form, setForm] = useState<TForm>(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(item ? fromItem(item) : blankForm());
    setError(null);
    setSaving(false);
    setDeleting(false);
  }, [open, item, blankForm, fromItem]);

  const updateField = useCallback(<K extends keyof TForm>(key: K, value: TForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    form,
    setForm,
    saving,
    setSaving,
    deleting,
    setDeleting,
    error,
    setError,
    updateField,
  };
}
