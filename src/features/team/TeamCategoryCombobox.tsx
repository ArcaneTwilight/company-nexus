import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import { fieldClass } from "../../components/modals";

interface TeamCategoryComboboxProps {
  id: string;
  value: string;
  categories: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TeamCategoryCombobox({
  id,
  value,
  categories,
  onChange,
  disabled = false,
}: TeamCategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const options = useMemo(() => {
    const query = value.trim().toLowerCase();
    const matched = query
      ? categories.filter((category) => category.toLowerCase().includes(query))
      : categories;
    const exactMatch = categories.some(
      (category) => category.toLowerCase() === query
    );
    const canCreate = Boolean(query) && !exactMatch;
    return { matched, canCreate, createLabel: value.trim() };
  }, [categories, value]);

  const flatOptions = useMemo(() => {
    const items = [...options.matched];
    if (options.canCreate) items.push(options.createLabel);
    return items;
  }, [options]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [value, open]);

  function selectCategory(category: string) {
    onChange(category);
    close();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((index) =>
        flatOptions.length === 0 ? 0 : Math.min(index + 1, flatOptions.length - 1)
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && flatOptions[highlightIndex]) {
      event.preventDefault();
      selectCategory(flatOptions[highlightIndex]);
      return;
    }
    if (event.key === "Escape") {
      close();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`${fieldClass} pr-9`}
          placeholder="Select or type a team"
          required
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Toggle team list"
          onClick={() => setOpen((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-muted hover:text-fg disabled:opacity-50"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-panel-elevated py-1 shadow-xl backdrop-blur-md"
        >
          {options.matched.map((category, index) => (
            <li key={category} role="option" aria-selected={value === category}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCategory(category)}
                className={`flex w-full px-3 py-1.5 text-left text-xs transition-colors ${
                  index === highlightIndex
                    ? "bg-white/10 text-fg"
                    : "text-fg-muted hover:bg-white/5 hover:text-fg"
                }`}
              >
                {category}
              </button>
            </li>
          ))}
          {options.canCreate && (
            <li
              role="option"
              aria-selected={false}
              className={options.matched.length > 0 ? "border-t border-border" : ""}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCategory(options.createLabel)}
                className={`flex w-full px-3 py-1.5 text-left text-xs transition-colors ${
                  highlightIndex === options.matched.length
                    ? "bg-indigo-500/20 text-indigo-800 dark:text-indigo-200"
                    : "text-indigo-300 hover:bg-indigo-500/10"
                }`}
              >
                Create “{options.createLabel}”
              </button>
            </li>
          )}
          {flatOptions.length === 0 && (
            <li className="px-3 py-2 text-[11px] text-fg-subtle">
              Type a new team name
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
