import { displayOrDash, EmptyValue } from "../EmptyValue";

export function PillValue({ value }: { value: string }) {
  const shown = displayOrDash(value);
  if (!shown) return <EmptyValue />;
  return (
    <span className="inline-flex max-w-[8rem] truncate rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] text-fg-muted">
      {shown}
    </span>
  );
}
