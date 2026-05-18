import { FormEvent, useEffect, useState } from "react";
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

export function ProfilePage() {
  const meQuery = useMeProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const [form, setForm] = useState<ProfileFormState>(defaultForm);

  const profile = meQuery.data?.profile;

  useEffect(() => {
    if (!profile) {
      return;
    }

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
  }, [profile]);

  function updateField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateProfileMutation.mutate({
      username: form.username.trim().toLowerCase(),
      display_name: form.display_name.trim(),
      bio: form.bio.trim(),
      social_links: {
        instagram: form.instagram.trim(),
        tiktok: form.tiktok.trim(),
        website: form.website.trim(),
        facebook: form.facebook.trim(),
        behance: form.behance.trim(),
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
    <div className="mx-auto max-w-4xl">
      <div>
        <p className="text-sm font-semibold text-fg-soft">
          Profil i ustawienia
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">
          Profil fotografa
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
          Uzupełnij username, nazwę wyświetlaną, bio i linki społecznościowe.
          Username będzie później używany w publicznym portfolio.
        </p>
      </div>

      {!profile ? (
        <div className="mt-8 rounded-card border border-warning/20 bg-warning-soft p-5 text-warning">
          <p className="font-semibold">Profil nie jest jeszcze utworzony</p>
          <p className="mt-1 text-sm opacity-80">
            Po pierwszym zapisie backend utworzy Twój profil fotografa.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Username"
            placeholder="jan-kowalski"
            value={form.username}
            onChange={(event) => updateField("username", event.target.value)}
            hint="Małe litery, cyfry i myślniki. Bez spacji."
          />

          <Input
            label="Nazwa wyświetlana"
            placeholder="Jan Kowalski Fotografia"
            value={form.display_name}
            onChange={(event) =>
              updateField("display_name", event.target.value)
            }
          />

          <Textarea
            label="Bio"
            placeholder="Napisz krótko o sobie i swoim stylu fotografii..."
            value={form.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            containerClassName="md:col-span-2"
            hint="Maksymalnie 1000 znaków."
          />

          <Input
            label="Instagram"
            placeholder="https://instagram.com/twojprofil"
            value={form.instagram}
            onChange={(event) => updateField("instagram", event.target.value)}
          />

          <Input
            label="TikTok"
            placeholder="https://tiktok.com/@twojprofil"
            value={form.tiktok}
            onChange={(event) => updateField("tiktok", event.target.value)}
          />

          <Input
            label="Strona www"
            placeholder="https://twojadomena.pl"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
          />

          <Input
            label="Facebook"
            placeholder="https://facebook.com/twojprofil"
            value={form.facebook}
            onChange={(event) => updateField("facebook", event.target.value)}
          />

          <Input
            label="Behance"
            placeholder="https://behance.net/twojprofil"
            value={form.behance}
            onChange={(event) => updateField("behance", event.target.value)}
          />
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            variant="secondary"
            isLoading={updateProfileMutation.isPending}
          >
            Zapisz profil
          </Button>
        </div>
      </form>
    </div>
  );
}
