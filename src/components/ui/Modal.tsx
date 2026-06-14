import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils/cn";
import { Button } from "./Button";

type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeLabel?: string;
  closeOnOverlayClick?: boolean;
  className?: string;
};

const modalSizes: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  closeLabel = "Zamknij",
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center p-4">
      <button
        type="button"
        aria-label="Zamknij modal"
        className="fb-fade absolute inset-0 cursor-default bg-secondary/40 backdrop-blur-sm"
        onClick={() => {
          if (closeOnOverlayClick) {
            onOpenChange(false);
          }
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "fb-pop relative z-10 w-full rounded-card border border-border bg-surface shadow-card",
          "max-h-[calc(100dvh-2rem)] overflow-hidden",
          modalSizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            {title ? (
              <h2 id={titleId} className="text-xl font-semibold text-fg">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => onOpenChange(false)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-fg-muted transition hover:bg-bg-muted hover:text-fg"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-border bg-surface-muted px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ModalCloseButton({
  onClick,
  children = "Anuluj",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <Button variant="outline" onClick={onClick}>
      {children}
    </Button>
  );
}
