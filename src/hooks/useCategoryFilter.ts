import { useMemo, useState } from "react";

export function useCategoryFilter<T>(
  items: T[],
  getCategory: (item: T) => string,
  options?: { exclude?: (item: T) => boolean }
) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const filtered = options?.exclude ? items.filter((item) => !options.exclude!(item)) : items;
    return ["All", ...Array.from(new Set(filtered.map(getCategory)))];
  }, [items, getCategory, options?.exclude]);

  function matchesCategory(item: T) {
    return selectedCategory === "All" || getCategory(item) === selectedCategory;
  }

  return { selectedCategory, setSelectedCategory, categories, matchesCategory };
}
