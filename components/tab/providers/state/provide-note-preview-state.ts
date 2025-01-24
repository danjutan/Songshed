import type { GuitarStore, NotePosition } from "~/model/stores";
import {
  notePositionKeyFromKey,
  notePositionKey,
  type NotePositionKey,
  type SelectionState,
} from "./provide-selection-state";
import type { GuitarNote } from "~/model/data";
import { computed } from "vue";

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

    for (const selectedPos of selectionState.selections) {
      const note = guitar.getNote(notePositionKeyFromKey(selectedPos));
      if (!note) continue;

      const { string, position } = notePositionKeyFromKey(selectedPos);
      const newPosition = {
        string: string + deltaString,
        position: position + deltaPosition,
      };

      const newNote: GuitarNote = {
        note:
          note.note === "muted"
            ? "muted"
            : ((note.note +
                (guitar.tuning[newPosition.string] -
                  guitar.tuning[string])) as Midi),
      };

      previews[notePositionKey(newPosition)] = newNote;
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
