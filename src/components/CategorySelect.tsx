import { useEffect, useMemo, useState } from "react";
import {
  type CategoryKind,
  getCategoryOptions,
  registerCustomCategory,
} from "../lib/categories";

const OTHER_VALUE = "__OTHER__";

interface CategorySelectProps {
  kind: CategoryKind;
  value: string;
  onChange: (value: string) => void;
  extraCategories?: string[];
  label?: string;
  required?: boolean;
}

export function CategorySelect({
  kind,
  value,
  onChange,
  extraCategories = [],
  label = "Category",
  required = true,
}: CategorySelectProps) {
  const [optionsTick, setOptionsTick] = useState(0);
  const options = useMemo(
    () => getCategoryOptions(kind, extraCategories),
    [kind, extraCategories, optionsTick]
  );

  const valueInOptions = Boolean(value) && options.includes(value);
  const [isOther, setIsOther] = useState(() => Boolean(value) && !valueInOptions);
  const [customValue, setCustomValue] = useState(valueInOptions ? "" : value);

  // Sync from an externally-provided value (e.g. when editing an existing item
  // or switching create/edit modes). We never force-reset on an empty value so
  // that choosing "Other" (which clears value until typed) stays sticky.
  useEffect(() => {
    if (value && options.includes(value)) {
      setIsOther(false);
      setCustomValue("");
    } else if (value && !isOther) {
      setIsOther(true);
      setCustomValue(value);
    }
  }, [value, options, isOther]);

  const selectValue = isOther
    ? OTHER_VALUE
    : value && options.includes(value)
      ? value
      : options[0] ?? OTHER_VALUE;

  function persistCustom(trimmed: string) {
    registerCustomCategory(kind, trimmed);
    setOptionsTick((tick) => tick + 1);
  }

  function handleSelectChange(next: string) {
    if (next === OTHER_VALUE) {
      setIsOther(true);
      const draft = customValue.trim();
      if (draft) {
        persistCustom(draft);
        onChange(draft);
      } else {
        onChange("");
      }
      return;
    }
    setIsOther(false);
    setCustomValue("");
    onChange(next);
  }

  function handleCustomChange(next: string) {
    setCustomValue(next);
    onChange(next);
  }

  function handleCustomBlur() {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    persistCustom(trimmed);
    onChange(trimmed);
  }

  const selectClass =
    "w-full px-3 py-2 bg-panel-solid border border-border rounded-lg text-fg text-xs sm:text-sm focus:outline-none focus:border-sky-500/50";
  const inputClass =
    "w-full px-3 py-2 bg-panel-solid border border-border rounded-lg text-fg text-xs sm:text-sm focus:outline-none focus:border-sky-500/50";

  return (
    <div>
      <label className="block text-[12px] font-semibold text-fg-muted uppercase tracking-wider font-mono mb-1.5">
        {label}
      </label>
      <select
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        className={selectClass}
        required={required && selectValue !== OTHER_VALUE}
      >
        {options.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value={OTHER_VALUE}>Other</option>
      </select>

      {selectValue === OTHER_VALUE && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          onBlur={handleCustomBlur}
          placeholder="Enter custom category"
          className={`${inputClass} mt-2`}
          required={required}
        />
      )}
    </div>
  );
}
