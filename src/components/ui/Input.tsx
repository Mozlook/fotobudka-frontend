import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cn } from "../../lib/utils/cn";

type InputSize = "sm" | "md" | "lg";

export type InputProps = Omit<ComponentPropsWithoutRef<"input">, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  inputSize?: InputSize;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
};

const inputSizes: Record<InputSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      inputSize = "md",
      leftElement,
      rightElement,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);

    const describedBy = [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-fg"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          {leftElement ? (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-soft">
              {leftElement}
            </div>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full rounded-input border bg-surface text-fg shadow-sm outline-none transition",
              "placeholder:text-fg-soft hover:border-border-strong",
              "focus:border-main focus:ring-4 focus:ring-main/15",
              "disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-fg-soft",
              hasError
                ? "border-danger focus:border-danger focus:ring-danger/15"
                : "border-border",
              inputSizes[inputSize],
              leftElement && "pl-10",
              rightElement && "pr-10",
              className,
            )}
            {...props}
          />

          {rightElement ? (
            <div className="absolute inset-y-0 right-3 flex items-center text-fg-soft">
              {rightElement}
            </div>
          ) : null}
        </div>

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

Input.displayName = "Input";
