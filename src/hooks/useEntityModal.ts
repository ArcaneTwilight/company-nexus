import { useCallback, useState } from "react";

/** Standard open/create/edit/close flow for entity modals. */
export function useEntityModal<T>() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEditingItem(null);
  }, []);

  return { open, editingItem, openCreate, openEdit, close };
}
