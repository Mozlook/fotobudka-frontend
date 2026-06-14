import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button, Input, Spinner, Textarea } from "../../components/ui";
import { useMeProfileQuery, useUpdateProfileMutation } from "../auth/hooks";

type ProfileFormState = {
  username: string;
  display_name: string;
  bio: string;
  instagram: string;
  tiktok: string;
  website: string;
  facebook: string;
  behance: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

const defaultForm: ProfileFormState = {
  username: "",
  display_name: "",
  bio: "",
  instagram: "",
  tiktok: "",
  website: "",
  facebook: "",
  behance: "",
};

const reservedUsernames = new Set([
  "api",
  "auth",
  "public",
  "me",
  "login",
  "logout",
  "s",
  "client",
  "app",
]);

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "").replace(/^\/+/, "");
}

function isValidUsername(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(value);
}

function normalizeUrl(value: string) {
  return value.trim();
}

function isProbablyUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFilledSocialCount(form: ProfileFormState) {
  return [
    form.instagram,
    form.tiktok,
    form.website,
    form.facebook,
    form.behance,
  ].filter((value) => value.trim()).length;
}

function validateProfileForm(form: ProfileFormState) {
  const errors: ProfileFormErrors = {};

  const username = normalizeUsername(form.username);
  const displayName = form.display_name.trim();
  const bio = form.bio.trim();

  if (!username) {
    errors.username = "Podaj username.";
  } else if (!isValidUsername(username)) {
    errors.username =
      "Username musi mieć 3–32 znaki i może zawierać małe litery, cyfry oraz myślniki.";
  } else if (reservedUsernames.has(username)) {
    errors.username = "Ten username jest zarezerwowany.";
  }

  if (!displayName) {
    errors.display_name = "Podaj nazwę wyświetlaną.";
  } else if (displayName.length > 80) {
    errors.display_name = "Nazwa wyświetlana może mieć maksymalnie 80 znaków.";
  }

  if (bio.length > 1000) {
    errors.bio = "Bio może mieć maksymalnie 1000 znaków.";
  }

  const urlFields: Array<keyof ProfileFormState> = [
    "instagram",
    "tiktok",
    "website",
    "facebook",
    "behance",
  ];

  for (const field of urlFields) {
    const value = form[field].trim();

    if (value && !isProbablyUrl(value)) {
      errors[field] =
        "Podaj pełny adres zaczynający się od http:// lub https://.";
    }
  }

  return errors;
}

export function ProfilePage() {
  const meQuery = useMeProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const [form, setForm] = useState<ProfileFormState>(defaultForm);
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  const profile = meQuery.data?.profile;

  const publicProfilePath = profile?.username ? `/${profile.username}` : null;

  const filledSocialCount = useMemo(() => getFilledSocialCount(form), [form]);

  const profileStatus = profile ? "Uzupełniony" : "Nieutworzony";

  // Seed the form from the loaded profile without an effect: adjust state
  // during render when the profile reference changes, guarded against loops.
  const [seededProfile, setSeededProfile] = useState(profile);

  if (profile && profile !== seededProfile) {
    setSeededProfile(profile);

    setForm({
      username: profile.username ?? "",
      display_name: profile.display_name ?? "",
      bio: profile.bio ?? "",
      instagram: profile.social_links?.instagram ?? "",
      tiktok: profile.social_links?.tiktok ?? "",
      website: profile.social_links?.website ?? "",
      facebook: profile.social_links?.facebook ?? "",
      behance: profile.social_links?.behance ?? "",
    });
  }

  function updateField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedForm: ProfileFormState = {
      username: normalizeUsername(form.username),
      display_name: form.display_name.trim(),
      bio: form.bio.trim(),
      instagram: normalizeUrl(form.instagram),
      tiktok: normalizeUrl(form.tiktok),
      website: normalizeUrl(form.website),
      facebook: normalizeUrl(form.facebook),
      behance: normalizeUrl(form.behance),
    };

    const nextErrors = validateProfileForm(normalizedForm);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Sprawdź poprawność formularza.");
      return;
    }

    setForm(normalizedForm);

    updateProfileMutation.mutate({
      username: normalizedForm.username,
      display_name: normalizedForm.display_name,
      bio: normalizedForm.bio,
      social_links: {
        instagram: normalizedForm.instagram,
        tiktok: normalizedForm.tiktok,
        website: normalizedForm.website,
        facebook: normalizedForm.facebook,
        behance: normalizedForm.behance,
      },
    });
  }

  if (meQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-border bg-surface p-6 shadow-card-sm">
        <div className="flex items-center gap-3">
          <Spinner />
          <p className="text-sm text-fg-muted">Ładuję profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  profile
                    ? "rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                    : "rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning"
                }
              >
                {profileStatus}
              </span>

              {profile?.username ? (
                <span className="rounded-full bg-main-soft px-2.5 py-1 text-xs font-semibold text-fg">
                  /{profile.username}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              Profil publiczny fotografa
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              Te dane są używane w publicznym portfolio. Username tworzy adres
              publiczny, a nazwa wyświetlana, bio i linki społecznościowe są
              widoczne dla odwiedzających.
            </p>

            {publicProfilePath ? (
              <Link
                to={publicProfilePath}
                target="_blank"
                className="mt-4 inline-flex text-sm font-semibold text-main-active transition hover:text-main-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                Zobacz publiczny profil: {publicProfilePath}
              </Link>
            ) : null}
          </div>

          <div className="rounded-card border border-border bg-bg p-4 lg:min-w-64">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
              Podsumowanie
            </p>

            <div className="mt-3 grid gap-3 text-sm">
              <div>
                <p className="text-fg-muted">Nazwa publiczna</p>
                <p className="mt-1 font-semibold text-fg">
                  {form.display_name.trim() || "—"}
                </p>
              </div>

              <div>
                <p className="text-fg-muted">Adres</p>
                <p className="mt-1 break-all font-mono text-xs font-semibold text-fg">
                  /{normalizeUsername(form.username) || "username"}
                </p>
              </div>

              <div>
                <p className="text-fg-muted">Linki społecznościowe</p>
                <p className="mt-1 font-semibold text-fg">
                  {filledSocialCount} / 5
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!profile ? (
        <section className="mt-6 rounded-card border border-warning/20 bg-warning-soft p-5 text-warning shadow-card-sm">
          <p className="font-semibold">Profil nie jest jeszcze utworzony</p>

          <p className="mt-1 max-w-3xl text-sm leading-6 opacity-80">
            Po pierwszym poprawnym zapisie backend utworzy Twój profil
            fotografa. Dopiero wtedy publiczne portfolio będzie dostępne pod
            adresem /username.
          </p>
        </section>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card"
      >
        <section>
          <div>
            <p className="text-sm font-semibold text-fg-soft">Dane publiczne</p>

            <h2 className="mt-1 text-2xl font-semibold text-fg">
              Nazwa i adres portfolio
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
              Username jest używany w publicznym adresie portfolio. Nazwa
              wyświetlana pojawia się jako główny tytuł profilu.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input
              label="Username"
              placeholder="ziutson"
              value={form.username}
              onChange={(event) =>
                updateField("username", normalizeUsername(event.target.value))
              }
              error={errors.username}
              hint="Wymagane. Małe litery, cyfry i myślniki. Minimum 3 znaki."
            />

            <Input
              label="Nazwa wyświetlana"
              placeholder="Ziutson Fotografia"
              value={form.display_name}
              onChange={(event) =>
                updateField("display_name", event.target.value)
              }
              error={errors.display_name}
              hint="Wymagane. Widoczne na publicznym profilu."
            />
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-8">
          <div>
            <p className="text-sm font-semibold text-fg-soft">Opis</p>

            <h2 className="mt-1 text-2xl font-semibold text-fg">
              Bio fotografa
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
              Krótko opisz styl pracy, typ fotografii albo informacje ważne dla
              klientów odwiedzających portfolio.
            </p>
          </div>

          <div className="mt-6">
            <Textarea
              label="Bio"
              placeholder="Napisz krótko o sobie i swoim stylu fotografii..."
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              error={errors.bio}
              hint={`${form.bio.trim().length} / 1000 znaków`}
            />
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-8">
          <div>
            <p className="text-sm font-semibold text-fg-soft">Social links</p>

            <h2 className="mt-1 text-2xl font-semibold text-fg">
              Linki społecznościowe
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
              Wszystkie pola są opcjonalne. Wpisuj pełne adresy zaczynające się
              od http:// albo https://.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input
              label="Instagram"
              placeholder="https://instagram.com/twojprofil"
              value={form.instagram}
              onChange={(event) => updateField("instagram", event.target.value)}
              error={errors.instagram}
            />

            <Input
              label="TikTok"
              placeholder="https://tiktok.com/@twojprofil"
              value={form.tiktok}
              onChange={(event) => updateField("tiktok", event.target.value)}
              error={errors.tiktok}
            />

            <Input
              label="Strona www"
              placeholder="https://twojadomena.pl"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              error={errors.website}
            />

            <Input
              label="Facebook"
              placeholder="https://facebook.com/twojprofil"
              value={form.facebook}
              onChange={(event) => updateField("facebook", event.target.value)}
              error={errors.facebook}
            />

            <Input
              label="Behance"
              placeholder="https://behance.net/twojprofil"
              value={form.behance}
              onChange={(event) => updateField("behance", event.target.value)}
              error={errors.behance}
            />
          </div>
        </section>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-fg-muted">
            Po zapisie zmiany będą widoczne na publicznym profilu.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            {publicProfilePath ? (
              <Link
                to={publicProfilePath}
                target="_blank"
                className="inline-flex h-10 items-center justify-center rounded-button border border-border bg-surface px-4 text-sm font-semibold text-fg transition hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
              >
                Podgląd publiczny
              </Link>
            ) : null}

            <Button
              type="submit"
              variant="secondary"
              isLoading={updateProfileMutation.isPending}
            >
              Zapisz profil
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
