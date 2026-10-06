import { useState } from "react";

interface CommentsCellProps {
  text: string;
}

/** Visible comments with 2-line clamp and an inline “more” expand. */
export function CommentsCell({ text }: CommentsCellProps) {
  const [expanded, setExpanded] = useState(false);
  const value = text.trim();

  if (!value) {
    return <span className="text-fg-subtle">—</span>;
  }

  const needsMore = value.length > 90 || value.includes("\n");

  return (
    <div className="text-xs leading-relaxed text-fg-muted">
      <p className={expanded ? "whitespace-pre-wrap" : "line-clamp-2 whitespace-pre-wrap"}>
        {value}
      </p>
      {needsMore && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((open) => !open);
          }}
          className="mt-0.5 text-[10px] font-medium text-indigo-300/90 hover:text-indigo-200"
        >
          {expanded ? "Less" : "More"}
        </button>
      )}
    </div>
  );
}
