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

  const isLocked = session.status !== "selecting" || submittedResult !== null;

  const selectedCount = useMemo(() => {
    return photos.reduce((count, photo) => {
      const state = getDraftForPhoto(draft, photo);

      return state.selected ? count + 1 : count;
    }, 0);
  }, [draft, photos]);

  const extraCount = Math.max(0, selectedCount - session.included_count);

  const estimatedAmountCents =
    session.base_price_cents + extraCount * session.extra_price_cents;

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
        <p className="text-sm font-semibold text-fg-soft">Sesja klienta</p>

        <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-fg">
              {session.title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
              Przejrzyj proofy, wybierz zdjęcia do obróbki i dodaj notatki.
              Zmiany zapisują się automatycznie.
            </p>
          </div>

          <div className="rounded-card bg-main-subtle px-4 py-3 text-sm">
            <p className="font-semibold text-fg">
              Status: {submittedResult?.status ?? session.status}
            </p>
            <p className="mt-1 text-fg-muted">
              Cena bazowa:{" "}
              {formatMoney(session.base_price_cents, session.currency)}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
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

                  return (
                    <article
                      key={photo.id}
                      className={cn(
                        "overflow-hidden rounded-card border bg-surface shadow-card-sm transition",
                        state.selected
                          ? "border-main ring-4 ring-main-soft"
                          : "border-border",
                      )}
                    >
                      <button
                        type="button"
                        className="group relative block aspect-[4/3] w-full overflow-hidden bg-bg"
                        onClick={() => setActivePhotoIndex(index)}
                      >
                        <img
                          src={photo.thumb_url}
                          alt={photo.original_filename}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                        />

                        {state.selected ? (
                          <span className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                            Wybrane
                          </span>
                        ) : null}

                        {state.note.trim() ? (
                          <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-fg shadow-card-sm">
                            Ma notatkę
                          </span>
                        ) : null}
                      </button>

                      <div className="p-4">
                        <p className="truncate text-sm font-semibold text-fg">
                          {photo.original_filename}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant={state.selected ? "secondary" : "outline"}
                            disabled={isLocked}
                            onClick={() => handleToggleSelected(photo)}
                            className="flex-1"
                          >
                            {state.selected ? "Wybrane" : "Wybierz"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActivePhotoIndex(index)}
                          >
                            Podgląd
                          </Button>
                        </div>
                      </div>
                    </article>
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
                  <p className="text-sm text-fg-muted">
                    To wszystkie gotowe zdjęcia w tej sesji.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        <SelectionSummary
          session={session}
          selectedCount={selectedCount}
          loadedCount={loadedCount}
          totalCount={totalCount}
          isLocked={isLocked}
          isSaving={updateSelectionsMutation.isPending}
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
                updateSelectionsMutation.isPending
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

          <div className="rounded-card border border-warning/20 bg-warning-soft p-4 text-warning">
            <p className="font-semibold">Po zatwierdzeniu</p>
            <p className="mt-1 text-sm leading-6 opacity-80">
              Nie będzie można zmieniać wyboru ani notatek. Backend zweryfikuje
              minimalną liczbę wyboru i zapisze snapshot kwoty płatności.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
