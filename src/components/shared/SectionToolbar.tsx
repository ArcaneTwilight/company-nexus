import type { ReactNode } from "react";
import { Fragment } from "react";
import { LayoutGroup } from "motion/react";
import { SearchInput } from "../SearchInput";
import { FilterChip } from "../motion";

interface SectionToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categoryIcon?: ReactNode;
  actions?: ReactNode;
  searchClassName?: string;
}

export function SectionToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  categories,
  selectedCategory,
  onCategoryChange,
  categoryIcon,
  actions,
  searchClassName = "w-full md:w-80",
}: SectionToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-panel p-4 rounded-xl border border-border">
      <div className={searchClassName}>
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>

      {(categories || actions) && (
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-between md:justify-end">
          {categories && onCategoryChange && selectedCategory !== undefined && (
            <LayoutGroup>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {categoryIcon}
                {categories.map((cat) => (
                  <Fragment key={cat}>
                    <FilterChip
                      label={cat}
                      active={selectedCategory === cat}
                      onClick={() => onCategoryChange(cat)}
                    />
                  </Fragment>
                ))}
              </div>
            </LayoutGroup>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
