import { cn } from "../../../lib/utils/cn";
import type { SessionStatus } from "../types";
import { getSessionStatusMeta } from "../utils";

export function SessionStatusBadge({
  status,
  className,
}: {
  status: SessionStatus;
  className?: string;
}) {
  const meta = getSessionStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
