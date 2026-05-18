import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils/cn";
import { Spinner } from "./Spinner";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "soft"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-main text-main-foreground hover:bg-main-hover active:bg-main-active focus-visible:ring-main-soft",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active focus-visible:ring-secondary-soft",
  tertiary:
    "bg-tertiary text-tertiary-foreground hover:bg-tertiary-hover active:bg-tertiary-active focus-visible:ring-tertiary-soft",
  outline:
    "border border-border bg-surface text-fg hover:bg-bg-muted active:bg-bg-muted focus-visible:ring-main-soft",
  ghost:
    "bg-transparent text-fg hover:bg-bg-muted active:bg-bg-muted focus-visible:ring-main-soft",
  soft: "bg-main-soft text-fg hover:bg-main-subtle active:bg-main-subtle focus-visible:ring-main-soft",
  danger:
    "bg-danger text-danger-foreground hover:opacity-90 active:opacity-80 focus-visible:ring-danger-soft",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 rounded-button px-3 text-sm",
  md: "h-10 gap-2 rounded-button px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-button px-5 text-base",
};

export function Button({
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-4",
        "disabled:pointer-events-none disabled:opacity-55",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : leftIcon}
      <span>{children}</span>
      {!isLoading ? rightIcon : null}
    </button>
  );
}
