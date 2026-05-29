import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, EmptyState, Modal, Spinner } from "../../../components/ui";
import { storeClientSession } from "../../client-access/storage";
import type { ClientSessionAccessResult } from "../../client-access/types";
import { queryKeys } from "../../../lib/query/keys";
import { cn } from "../../../lib/utils/cn";
import {
  useClientPhotosInfiniteQuery,
  useSubmitSelectionMutation,
  useUpdateClientSelectionsMutation,
} from "../hooks";
import type {
  ClientPhoto,
  ClientSelectionDraft,
  SubmitSelectionResult,
} from "../types";
import { ProofModal } from "./ProofModal";
import { SelectionSummary } from "./SelectionSummary";
import { formatMoney } from "../../sessions/utils";

const NOTE_AUTOSAVE_DELAY_MS = 700;

type ClientSelectionViewProps = {
  session: ClientSessionAccessResult;
};

function getDraftForPhoto(draft: ClientSelectionDraft, photo: ClientPhoto) {
  return (
    draft[photo.id] ?? {
      selected: photo.selected,
      note: photo.note,
    }
  );
}

function getClientStatusMeta(status: string) {
  switch (status) {
    case "selecting":
      return {
        label: "Wybór zdjęć",
        className: "bg-main-soft text-main-active",
        description:
          "Możesz wybierać zdjęcia, dodawać notatki i zatwierdzić wybór.",
      };

    case "waiting_for_payment":
      return {
        label: "Oczekiwanie na płatność",
        className: "bg-warning-soft text-warning",
        description:
          "Wybór został zatwierdzony. Fotograf czeka na płatność manualną.",
      };

    case "editing":
      return {
        label: "W obróbce",
        className: "bg-tertiary-soft text-tertiary",
        description:
          "Fotograf pracuje nad finalnymi zdjęciami. Wybór jest zablokowany.",
      };

    case "delivered":
      return {
        label: "Dostarczone",
        className: "bg-success-soft text-success",
        description: "Finalna paczka ZIP jest gotowa do pobrania.",
      };

    default:
      return {
        label: status,
        className: "bg-bg-muted text-fg-muted",
        description: "Ta sesja nie jest aktualnie w trybie edycji wyboru.",
      };
  }
}

function StatusBadge({ status }: { status: string }) {
  const meta = getClientStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function SaveStateBadge({
  isSaving,
  pendingNotesCount,
}: {
  isSaving: boolean;
  pendingNotesCount: number;
}) {
  if (pendingNotesCount > 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-button bg-warning-soft px-3 py-2 text-sm font-semibold text-warning">
        <Spinner size="sm" />
        Zapisuję notatki...
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="inline-flex items-center gap-2 rounded-button bg-info-soft px-3 py-2 text-sm font-semibold text-info">
        <Spinner size="sm" />
        Zapisuję wybór...
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-button bg-success-soft px-3 py-2 text-sm font-semibold text-success">
      Zapis automatyczny aktywny
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  selected,
  hasNote,
  isLocked,
  onOpen,
  onToggleSelected,
}: {
  photo: ClientPhoto;
  index: number;
  selected: boolean;
  hasNote: boolean;
  isLocked: boolean;
  onOpen: () => void;
  onToggleSelected: () => void;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-card border bg-surface shadow-card-sm transition",
        selected
          ? "border-main ring-4 ring-main-soft"
          : "border-border hover:-translate-y-0.5 hover:shadow-card",
      )}
    >
      <button
        type="button"
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-bg text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-main-soft"
        onClick={onOpen}
        aria-label={`Otwórz podgląd zdjęcia ${photo.original_filename}`}
      >
        <img
          src={photo.thumb_url}
          alt={photo.original_filename}
          loading="lazy"
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {selected ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground shadow-card-sm">
              Wybrane
            </span>
          ) : null}

          {hasNote ? (
            <span className="rounded-full bg-surface/95 px-3 py-1 text-xs font-semibold text-fg shadow-card-sm">
              Ma notatkę
            </span>
          ) : null}
        </div>

        <span className="absolute bottom-3 right-3 rounded-full bg-fg/70 px-2.5 py-1 text-xs font-semibold text-fg-inverted">
          #{index + 1}
        </span>
      </button>

      <div className="p-4">
        <p className="truncate text-sm font-semibold text-fg">
          {photo.original_filename}
        </p>

        <p className="mt-1 text-xs text-fg-soft">
          Kliknij zdjęcie, żeby otworzyć proof i dodać notatkę.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button
            size="sm"
            variant={selected ? "secondary" : "outline"}
            disabled={isLocked}
            onClick={onToggleSelected}
          >
            {selected ? "Wybrane" : "Wybierz"}
          </Button>

          <Button size="sm" variant="ghost" onClick={onOpen}>
            Podgląd
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ClientSelectionView({ session }: ClientSelectionViewProps) {
  const queryClient = useQueryClient();

  const photosQuery = useClientPhotosInfiniteQuery(session.id);
  const updateSelectionsMutation = useUpdateClientSelectionsMutation(
    session.id,
  );
  const submitSelectionMutation = useSubmitSelectionMutation(session.id);

  const noteTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const [draft, setDraft] = useState<ClientSelectionDraft>({});
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittedResult, setSubmittedResult] =
    useState<SubmitSelectionResult | null>(null);

  const photos = useMemo(() => {
    return photosQuery.data?.pages.flatMap((page) => page.photos) ?? [];
  }, [photosQuery.data]);

  const firstPage = photosQuery.data?.pages[0];
  const totalCount = firstPage?.total_count;
  const loadedCount = photos.length;

  const effectiveStatus = submittedResult?.status ?? session.status;
  const statusMeta = getClientStatusMeta(effectiveStatus);

  const isLocked = effectiveStatus !== "selecting";

  const pendingNotesCount = Object.keys(noteTimersRef.current).length;

  const selectedCount = useMemo(() => {
    return photos.reduce((count, photo) => {
      const state = getDraftForPhoto(draft, photo);

      return state.selected ? count + 1 : count;
    }, 0);
  }, [draft, photos]);

  const selectedLoadedPhotos = useMemo(() => {
    return photos.filter((photo) => getDraftForPhoto(draft, photo).selected);
  }, [draft, photos]);

  const notesCount = useMemo(() => {
    return photos.filter((photo) => {
      const state = getDraftForPhoto(draft, photo);

      return state.note.trim().length > 0;
    }).length;
  }, [draft, photos]);

  const extraCount = Math.max(0, selectedCount - session.included_count);

  const estimatedAmountCents =
    session.base_price_cents + extraCount * session.extra_price_cents;

  const hasMinimumSelection = selectedCount >= session.min_select_count;

  useEffect(() => {
    setDraft((current) => {
      let changed = false;
      const next = { ...current };

      for (const photo of photos) {
        if (!next[photo.id]) {
          next[photo.id] = {
            selected: photo.selected,
            note: photo.note,
          };

          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [photos]);

  useEffect(() => {
    return () => {
      clearNoteTimers();
    };
  }, []);

  function clearNoteTimers() {
    Object.values(noteTimersRef.current).forEach((timer) => {
      clearTimeout(timer);
    });

    noteTimersRef.current = {};
  }

  function updateDraft(
    photoId: string,
    nextState: {
      selected: boolean;
      note: string;
    },
  ) {
    setDraft((current) => ({
      ...current,
      [photoId]: nextState,
    }));
  }

  function persistPhotoDelta(
    photoId: string,
    state: {
      selected: boolean;
      note: string;
    },
  ) {
    updateSelectionsMutation.mutate({
      items: [
        {
          photo_id: photoId,
          selected: state.selected,
          note: state.selected ? state.note.trim() : undefined,
        },
      ],
    });
  }

  function handleToggleSelected(photo: ClientPhoto) {
    if (isLocked) {
      return;
    }

    const current = getDraftForPhoto(draft, photo);

    const nextState = {
      ...current,
      selected: !current.selected,
    };

    updateDraft(photo.id, nextState);
    persistPhotoDelta(photo.id, nextState);
  }

  function handleNoteChange(photo: ClientPhoto, note: string) {
    if (isLocked) {
      return;
    }

    const current = getDraftForPhoto(draft, photo);

    if (!current.selected) {
      toast.info("Najpierw wybierz zdjęcie, żeby dodać notatkę.");
      return;
    }

    const nextState = {
      ...current,
      note,
    };

    updateDraft(photo.id, nextState);

    const existingTimer = noteTimersRef.current[photo.id];

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    noteTimersRef.current[photo.id] = setTimeout(() => {
      persistPhotoDelta(photo.id, nextState);
      delete noteTimersRef.current[photo.id];
    }, NOTE_AUTOSAVE_DELAY_MS);
  }

  async function flushLoadedSelections() {
    clearNoteTimers();

    if (photos.length === 0) {
      return;
    }

    await updateSelectionsMutation.mutateAsync({
      items: photos.map((photo) => {
        const state = getDraftForPhoto(draft, photo);

        return {
          photo_id: photo.id,
          selected: state.selected,
          note: state.selected ? state.note.trim() : undefined,
        };
      }),
    });
  }

  async function handleConfirmSubmit() {
    if (selectedCount < session.min_select_count) {
      toast.error(`Minimalna liczba wyboru to ${session.min_select_count}.`);
      return;
    }

    try {
      await flushLoadedSelections();
    } catch {
      return;
    }

    submitSelectionMutation.mutate(undefined, {
      onSuccess: (result) => {
        setSubmittedResult(result);
        setSubmitModalOpen(false);

        const updatedSession: ClientSessionAccessResult = {
          ...session,
          status: result.status,
        };

        queryClient.setQueryData(
          queryKeys.client.session(session.id),
          updatedSession,
        );

        storeClientSession(updatedSession);
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={effectiveStatus} />

              <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs font-semibold text-fg-muted">
                {loadedCount}
                {totalCount !== undefined ? ` / ${totalCount}` : ""} zdjęć
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg md:text-4xl">
              {session.title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              {statusMeta.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <SaveStateBadge
                isSaving={updateSelectionsMutation.isPending}
                pendingNotesCount={pendingNotesCount}
              />

              {isLocked ? (
                <div className="inline-flex items-center rounded-button bg-warning-soft px-3 py-2 text-sm font-semibold text-warning">
                  Zmiany zablokowane
                </div>
              ) : null}
            </div>
          </div>

          <aside className="rounded-card border border-border bg-bg p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-soft">
              Twoje podsumowanie
            </p>

            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-fg-muted">Wybrane zdjęcia</p>
                <p className="mt-1 text-3xl font-bold text-fg">
                  {selectedCount}
                </p>
              </div>

              <div>
                <p className="text-sm text-fg-muted">Notatki</p>
                <p className="mt-1 text-3xl font-bold text-fg">{notesCount}</p>
              </div>

              <div className="rounded-card bg-main-subtle p-4">
                <p className="text-sm text-fg-muted">Szacowana kwota</p>
                <p className="mt-1 text-2xl font-bold text-fg">
                  {formatMoney(estimatedAmountCents, session.currency)}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="rounded-card border border-border bg-surface p-5 shadow-card-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-fg-soft">
                  Proofy do wyboru
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-fg">
                  Przegląd zdjęć
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-muted">
                  Kliknij miniaturę, żeby zobaczyć większy proof. Notatki możesz
                  dopisać w podglądzie zdjęcia.
                </p>
              </div>

              <div className="text-sm text-fg-muted">
                Wybrane:{" "}
                <span className="font-semibold text-fg">{selectedCount}</span>
                {" · "}
                Minimum:{" "}
                <span className="font-semibold text-fg">
                  {session.min_select_count}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {photosQuery.isLoading ? (
              <div className="rounded-card border border-border bg-surface p-6 shadow-card-sm">
                <div className="flex items-center gap-3">
                  <Spinner />
                  <p className="text-sm text-fg-muted">
                    Ładuję zdjęcia do wyboru...
                  </p>
                </div>
              </div>
            ) : null}

            {photosQuery.isError ? (
              <div className="rounded-card border border-danger/20 bg-danger-soft p-6 text-danger">
                <p className="font-semibold">Nie udało się pobrać zdjęć</p>
                <p className="mt-1 text-sm opacity-80">
                  Sesja mogła wygasnąć, dostęp mógł zostać zregenerowany albo
                  backend zwrócił błąd.
                </p>

                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => photosQuery.refetch()}
                >
                  Spróbuj ponownie
                </Button>
              </div>
            ) : null}

            {photosQuery.isSuccess && photos.length === 0 ? (
              <EmptyState
                title="Brak zdjęć do wyboru"
                description="Fotograf prawdopodobnie jeszcze nie zakończył przetwarzania zdjęć albo sesja nie ma gotowych proofów."
              />
            ) : null}

            {photos.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo, index) => {
                    const state = getDraftForPhoto(draft, photo);
                    const hasNote = state.note.trim().length > 0;

                    return (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        index={index}
                        selected={state.selected}
                        hasNote={hasNote}
                        isLocked={isLocked}
                        onOpen={() => setActivePhotoIndex(index)}
                        onToggleSelected={() => handleToggleSelected(photo)}
                      />
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-center">
                  {photosQuery.hasNextPage ? (
                    <Button
                      variant="outline"
                      isLoading={photosQuery.isFetchingNextPage}
                      onClick={() => photosQuery.fetchNextPage()}
                    >
                      Załaduj więcej
                    </Button>
                  ) : (
                    <p className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-fg-muted">
                      To wszystkie gotowe zdjęcia w tej sesji.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </section>

        <SelectionSummary
          session={session}
          selectedCount={selectedCount}
          loadedCount={loadedCount}
          totalCount={totalCount}
          isLocked={isLocked}
          isSaving={updateSelectionsMutation.isPending || pendingNotesCount > 0}
          isSubmitting={submitSelectionMutation.isPending}
          submittedResult={submittedResult}
          onSubmitClick={() => setSubmitModalOpen(true)}
        />
      </div>

      <ProofModal
        open={activePhotoIndex !== null}
        photos={photos}
        activeIndex={activePhotoIndex}
        draft={draft}
        isLocked={isLocked}
        onOpenChange={(open) => {
          if (!open) {
            setActivePhotoIndex(null);
          }
        }}
        onActiveIndexChange={setActivePhotoIndex}
        onToggleSelected={handleToggleSelected}
        onNoteChange={handleNoteChange}
      />

      <Modal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
        title="Zatwierdzić wybór?"
        description="Po zatwierdzeniu wybór zostanie zablokowany, a fotograf przejdzie do rozliczenia płatności manualnej."
        footer={
          <>
            <Button
              variant="outline"
              disabled={submitSelectionMutation.isPending}
              onClick={() => setSubmitModalOpen(false)}
            >
              Anuluj
            </Button>

            <Button
              variant="secondary"
              isLoading={
                submitSelectionMutation.isPending ||
                updateSelectionsMutation.isPending ||
                pendingNotesCount > 0
              }
              onClick={handleConfirmSubmit}
            >
              Zatwierdź wybór
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-card border border-border bg-bg p-4">
            <p className="text-sm text-fg-muted">Wybrane zdjęcia</p>
            <p className="mt-1 text-3xl font-bold text-fg">{selectedCount}</p>
          </div>

          <div className="rounded-card border border-main/20 bg-main-subtle p-4">
            <p className="text-sm text-fg-muted">Szacowana kwota</p>
            <p className="mt-1 text-3xl font-bold text-fg">
              {formatMoney(estimatedAmountCents, session.currency)}
            </p>
          </div>

          {selectedLoadedPhotos.length > 0 ? (
            <div className="max-h-56 overflow-y-auto rounded-card border border-border">
              {selectedLoadedPhotos.map((photo) => {
                const state = getDraftForPhoto(draft, photo);

                return (
                  <div
                    key={photo.id}
                    className="border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <p className="truncate text-sm font-semibold text-fg">
                      {photo.original_filename}
                    </p>

                    {state.note.trim() ? (
                      <p className="mt-1 line-clamp-2 text-xs text-fg-muted">
                        Notatka: {state.note}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-fg-soft">Brak notatki</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {!hasMinimumSelection ? (
            <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
              <p className="font-semibold">Za mało zdjęć</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Minimalna liczba wyboru dla tej sesji to{" "}
                {session.min_select_count}.
              </p>
            </div>
          ) : (
            <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
              <p className="font-semibold">Po zatwierdzeniu</p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Nie będzie można zmieniać wyboru ani notatek. Backend
                zweryfikuje minimalną liczbę wyboru i zapisze snapshot kwoty
                płatności.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
