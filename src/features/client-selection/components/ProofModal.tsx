import { Button, Modal, Spinner, Textarea } from "../../../components/ui";
import type { ClientPhoto, ClientSelectionDraft } from "../types";
import { useProofUrlQuery } from "../hooks";

type ProofModalProps = {
  open: boolean;
  photos: ClientPhoto[];
  activeIndex: number | null;
  draft: ClientSelectionDraft;
  isLocked: boolean;
  onOpenChange: (open: boolean) => void;
  onActiveIndexChange: (index: number) => void;
  onToggleSelected: (photo: ClientPhoto) => void;
  onNoteChange: (photo: ClientPhoto, note: string) => void;
};

export function ProofModal({
  open,
  photos,
  activeIndex,
  draft,
  isLocked,
  onOpenChange,
  onActiveIndexChange,
  onToggleSelected,
  onNoteChange,
}: ProofModalProps) {
  const photo =
    activeIndex !== null && activeIndex >= 0 ? photos[activeIndex] : undefined;

  const proofQuery = useProofUrlQuery(photo?.id, {
    enabled: open && Boolean(photo),
  });

  if (!photo) {
    return null;
  }

  const state = draft[photo.id] ?? {
    selected: photo.selected,
    note: photo.note,
  };

  const canGoPrev = activeIndex !== null && activeIndex > 0;
  const canGoNext = activeIndex !== null && activeIndex < photos.length - 1;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={photo.original_filename}
      description="Podgląd proofa ze znakiem wodnym. Wybierz zdjęcie i dodaj notatkę dla fotografa."
      size="xl"
      footer={
        <>
          <Button
            variant="outline"
            disabled={!canGoPrev}
            onClick={() => {
              if (activeIndex !== null) {
                onActiveIndexChange(activeIndex - 1);
              }
            }}
          >
            Poprzednie
          </Button>

          <Button
            variant="outline"
            disabled={!canGoNext}
            onClick={() => {
              if (activeIndex !== null) {
                onActiveIndexChange(activeIndex + 1);
              }
            }}
          >
            Następne
          </Button>

          <Button
            variant={state.selected ? "secondary" : "outline"}
            disabled={isLocked}
            onClick={() => onToggleSelected(photo)}
          >
            {state.selected ? "Wybrane" : "Wybierz zdjęcie"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-card bg-bg">
          {proofQuery.isLoading ? (
            <div className="flex items-center gap-3 text-fg-muted">
              <Spinner />
              <span className="text-sm">Ładuję proof...</span>
            </div>
          ) : null}

          {proofQuery.isError ? (
            <div className="p-6 text-center">
              <p className="font-semibold text-danger">
                Nie udało się pobrać proofa
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                Spróbuj zamknąć modal i otworzyć zdjęcie ponownie.
              </p>
            </div>
          ) : null}

          {proofQuery.data ? (
            <img
              src={proofQuery.data.proof_url}
              alt={photo.original_filename}
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          ) : null}
        </div>

        <div className="rounded-card border border-border bg-bg p-4">
          <div>
            <p className="text-sm font-semibold text-fg-soft">Status zdjęcia</p>

            <div className="mt-3">
              <Button
                variant={state.selected ? "secondary" : "outline"}
                disabled={isLocked}
                onClick={() => onToggleSelected(photo)}
                className="w-full"
              >
                {state.selected ? "Zdjęcie wybrane" : "Wybierz zdjęcie"}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Textarea
              label="Notatka do zdjęcia"
              placeholder="Np. proszę usunąć drobną niedoskonałość skóry..."
              value={state.note}
              disabled={isLocked || !state.selected}
              onChange={(event) => onNoteChange(photo, event.target.value)}
              hint={
                state.selected
                  ? "Notatka zapisze się automatycznie."
                  : "Najpierw wybierz zdjęcie, żeby dodać notatkę."
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
