import type { GuitarStore, NotePosition } from "~/model/stores";
import {
  notePositionKeyFromKey,
  notePositionKey,
  type NotePositionKey,
  type SelectionState,
} from "./provide-selection-state";
import type { GuitarNote } from "~/model/data";

export interface NotePreviewState {
  useNotePreview: (
    position: NotePosition,
  ) => ComputedRef<GuitarNote | undefined>;
}

const NotePreviewInjectionKey = Symbol() as InjectionKey<NotePreviewState>;

export function provideNotePreviewState(
  selectionState: SelectionState,
  guitar: GuitarStore,
): NotePreviewState {
  const notePreviews = computed(() => {
    const previews: Record<NotePositionKey, GuitarNote> = {};

    if (selectionState.action !== "moving") {
      return previews;
    }

    const { deltaString, deltaPosition } = selectionState.movingOffset;

    for (const { position, note } of guitar.getMovedNotes(
      Array.from(selectionState.selections).map(notePositionKeyFromKey),
      deltaString,
      deltaPosition,
    )) {
      previews[notePositionKey(position)] = note;
    }

    return previews;
  });

  const notePreviewState = {
    useNotePreview: (position: NotePosition) =>
      computed(() => notePreviews.value[notePositionKey(position)]),
  };

  provide(NotePreviewInjectionKey, notePreviewState);

  return notePreviewState;
}

export function injectNotePreviewState() {
  return inject(NotePreviewInjectionKey) as NotePreviewState;
}
