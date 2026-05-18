import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

function DefaultEmptyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
      <path d="m8.5 13 2.25-2.25L14.5 14.5l1-1L20 18" />
      <path d="M8.5 9h.01" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-dashed border-border bg-surface-muted px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-main-soft text-main-active">
        {icon ?? <DefaultEmptyIcon />}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-fg">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-fg-muted">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
