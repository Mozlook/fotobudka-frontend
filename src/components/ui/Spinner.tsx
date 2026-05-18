import { cn } from "../../lib/utils/cn";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

export type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
  className?: string;
};

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
};

export function Spinner({
  size = "md",
  label = "Ładowanie",
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
        spinnerSizes[size],
        className,
      )}
    />
  );
}
