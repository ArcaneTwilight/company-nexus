interface EmptyValueProps {
  label?: string;
  muted?: boolean;
}

export function EmptyValue({ label = "—", muted = true }: EmptyValueProps) {
  return (
    <span className={muted ? "text-fg-subtle/70" : "text-fg-subtle"}>{label}</span>
  );
}

export function displayOrDash(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}
