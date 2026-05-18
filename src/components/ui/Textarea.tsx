import { forwardRef, useId, type ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/utils/cn";

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      hint,
      error,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hintId = `${textareaId}-hint`;
    const errorId = `${textareaId}-error`;
    const hasError = Boolean(error);

    const describedBy = [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-medium text-fg"
          >
            {label}
          </label>
        ) : null}

        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            "min-h-28 w-full resize-y rounded-input border bg-surface px-3 py-2 text-sm text-fg shadow-sm outline-none transition",
            "placeholder:text-fg-soft",
            "focus:border-main focus:ring-4 focus:ring-main-soft",
            "disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-fg-soft",
            hasError
              ? "border-danger focus:border-danger focus:ring-danger-soft"
              : "border-border",
            className,
          )}
          {...props}
        />

        {hint && !error ? (
          <p id={hintId} className="mt-2 text-sm text-fg-muted">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={errorId} className="mt-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
