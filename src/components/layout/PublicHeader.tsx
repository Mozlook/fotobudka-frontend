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
    return "bg-secondary text-secondary-foreground hover:bg-secondary-hover focus-visible:ring-secondary-soft";
  }

  if (variant === "soft") {
    return "bg-main-soft text-fg hover:bg-main-subtle focus-visible:ring-main-soft";
  }

  return "border border-border bg-surface text-fg hover:bg-bg-muted focus-visible:ring-main-soft";
}

function HeaderAction({ action }: { action: PublicHeaderAction }) {
  const className = cn(
    "rounded-button px-4 py-2 text-sm font-semibold transition",
    "focus-visible:outline-none focus-visible:ring-4",
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
        "sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to={logoTo} className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-main text-main-foreground">
            <span className="text-sm font-bold">FB</span>
          </div>

          <div>
            <p className="text-sm font-bold leading-none text-fg">FotoBudka</p>
            <p className="mt-1 text-xs text-fg-muted">{subtitle}</p>
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
