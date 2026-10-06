import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { durations } from "../lib/motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputClassName?: string;
  onFocus?: () => void;
  onClear?: () => void;
}

const defaultInputClassName =
  "w-full pl-9 pr-8 py-2 bg-panel-solid border border-border rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none text-sm font-sans input-glass-focus";

export function SearchInput({
  value,
  onChange,
  placeholder,
  inputClassName = defaultInputClassName,
  onFocus,
  onClear,
}: SearchInputProps) {
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);

  function handleClear() {
    onChange("");
    onClear?.();
  }

  return (
    <motion.div
      className="relative"
      animate={reduced || !focused ? { scale: 1 } : { scale: 1.01 }}
      transition={{ duration: durations.fast }}
    >
      <motion.span
        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-mono font-bold text-accent"
        animate={focused ? { opacity: 1 } : { opacity: 0.72 }}
        transition={{ duration: durations.fast }}
      >
        &gt;
      </motion.span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => setFocused(false)}
        className={inputClassName}
      />
      {value && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-fg-subtle hover:text-fg transition-colors"
          aria-label="Clear search"
          whileTap={reduced ? undefined : { scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}
