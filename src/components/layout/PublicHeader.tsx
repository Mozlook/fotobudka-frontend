import { Link } from "react-router";
import { cn } from "../../lib/utils/cn";

export type PublicHeaderAction = {
  label: string;
  to?: string;
  href?: string;
  variant?: "primary" | "outline" | "soft";
  ariaLabel?: string;
  target?: "_blank";
};

type PublicHeaderProps = {
  subtitle: string;
  actions?: PublicHeaderAction[];
  logoTo?: string;
  className?: string;
};

function getActionClassName(
  variant: PublicHeaderAction["variant"] = "outline",
) {
  if (variant === "primary") {
    return "bg-secondary text-secondary-foreground shadow-[0_10px_24px_-14px_rgb(35_27_21/0.7)] hover:bg-secondary-hover focus-visible:ring-secondary/25";
  }

  if (variant === "soft") {
    return "bg-main-soft text-main-active hover:bg-main-subtle focus-visible:ring-main/30";
  }

  return "border border-border-strong/70 bg-surface text-fg hover:border-border-strong hover:bg-bg-muted focus-visible:ring-main/30";
}

function HeaderAction({ action }: { action: PublicHeaderAction }) {
  const className = cn(
    "inline-flex h-10 items-center rounded-button px-4 text-sm font-semibold",
    "transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-px",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    getActionClassName(action.variant),
  );

  if (action.href) {
    return (
      <a
        href={action.href}
        aria-label={action.ariaLabel}
        target={action.target}
        rel={action.target === "_blank" ? "noreferrer" : undefined}
        className={className}
      >
        {action.label}
      </a>
    );
  }

  return (
    <Link
      to={action.to ?? "/"}
      aria-label={action.ariaLabel}
      target={action.target}
      rel={action.target === "_blank" ? "noreferrer" : undefined}
      className={className}
    >
      {action.label}
    </Link>
  );
}

export function PublicHeader({
  subtitle,
  actions = [],
  logoTo = "/",
  className,
}: PublicHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-bg/70 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to={logoTo} className="group flex items-center gap-3">
          <span className="relative flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-card-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-3">
            <span className="font-display text-lg font-semibold leading-none">
              F
            </span>
            <span className="absolute -right-1 -top-1 size-3 rounded-full bg-main ring-2 ring-bg" />
          </span>

          <div>
            <p className="font-display text-base font-semibold leading-none tracking-tight text-fg">
              FotoBudka
            </p>
            <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.18em] text-fg-soft">
              {subtitle}
            </p>
          </div>
        </Link>

        {actions.length > 0 ? (
          <nav
            aria-label="Nawigacja publiczna"
            className="flex flex-wrap gap-2"
          >
            {actions.map((action) => (
              <HeaderAction
                key={`${action.label}-${action.to ?? action.href ?? ""}`}
                action={action}
              />
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
