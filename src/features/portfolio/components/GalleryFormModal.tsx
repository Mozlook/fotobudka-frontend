import { FormEvent, useEffect, useState } from "react";
import { Button, Input, Modal } from "../../../components/ui";
import type { Gallery, UpsertGalleryInput } from "../types";

type GalleryFormModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  gallery?: Gallery | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UpsertGalleryInput) => void;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ż/g, "z")
    .replace(/ź/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GalleryFormModal({
  open,
  title,
  submitLabel,
  gallery,
  isPending = false,
  onOpenChange,
  onSubmit,
}: GalleryFormModalProps) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    is_public: false,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      title: gallery?.title ?? "",
      slug: gallery?.slug ?? "",
      is_public: gallery?.is_public ?? false,
    });
  }, [gallery, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      is_public: form.is_public,
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Galeria będzie widoczna publicznie tylko wtedy, gdy ustawisz ją jako opublikowaną."
      footer={
        <>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Anuluj
          </Button>

          <Button
            type="submit"
            form="gallery-form"
            variant="secondary"
            isLoading={isPending}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="gallery-form" onSubmit={handleSubmit} className="grid gap-5">
        <Input
          label="Tytuł galerii"
          placeholder="Sesje rodzinne"
          value={form.title}
          onChange={(event) => {
            const nextTitle = event.target.value;

            setForm((current) => ({
              ...current,
              title: nextTitle,
              slug: current.slug || slugify(nextTitle),
            }));
          }}
        />

        <Input
          label="Slug publiczny"
          placeholder="sesje-rodzinne"
          value={form.slug}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              slug: slugify(event.target.value),
            }))
          }
          hint="Będzie częścią adresu publicznego galerii."
        />

        <label className="flex items-start gap-3 rounded-card border border-border bg-bg p-4">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                is_public: event.target.checked,
              }))
            }
            className="mt-1 size-4 rounded border-border accent-current"
          />

          <span>
            <span className="block text-sm font-semibold text-fg">
              Opublikuj galerię
            </span>
            <span className="mt-1 block text-sm leading-6 text-fg-muted">
              Publiczne galerie są widoczne na profilu fotografa.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
