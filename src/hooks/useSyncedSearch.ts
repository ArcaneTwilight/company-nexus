import { useEffect, useState } from "react";

/** Syncs local search state when parent passes a new `initialSearch` (e.g. global nav). */
export function useSyncedSearch(initialSearch = "") {
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  return [searchTerm, setSearchTerm] as const;
}
