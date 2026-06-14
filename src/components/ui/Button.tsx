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
    "bg-main text-main-foreground shadow-[0_8px_20px_-10px_var(--color-main)] hover:bg-main-hover hover:shadow-[0_12px_26px_-12px_var(--color-main)] active:bg-main-active focus-visible:ring-main/35",
  secondary:
    "bg-secondary text-secondary-foreground shadow-[0_10px_24px_-14px_rgb(35_27_21/0.7)] hover:bg-secondary-hover active:bg-secondary-active focus-visible:ring-secondary/25",
  tertiary:
    "bg-tertiary text-tertiary-foreground hover:bg-tertiary-hover active:bg-tertiary-active focus-visible:ring-tertiary/35",
  outline:
    "border border-border-strong/70 bg-surface text-fg hover:border-border-strong hover:bg-bg-muted active:bg-bg-muted focus-visible:ring-main/30",
  ghost:
    "bg-transparent text-fg hover:bg-bg-muted active:bg-bg-muted focus-visible:ring-main/30",
  soft: "bg-main-soft text-main-active hover:bg-main-subtle active:bg-main-subtle focus-visible:ring-main/30",
  danger:
    "bg-danger text-danger-foreground shadow-[0_8px_20px_-12px_var(--color-danger)] hover:opacity-90 active:opacity-80 focus-visible:ring-danger/35",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 rounded-button px-3.5 text-sm",
  md: "h-10 gap-2 rounded-button px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-button px-5.5 text-base",
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
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold",
        "transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
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
