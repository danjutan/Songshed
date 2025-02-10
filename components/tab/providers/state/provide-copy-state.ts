import type { GuitarStore, NotePosition } from "~/model/stores";
import {
  notePositionKeyFromKey,
  type NotePositionKey,
  type SelectionState,
} from "./provide-selection-state";

export interface CopyState {
  // copiedPositions: NotePosition[];
  copy: () => void;
  paste: (targetPosition: NotePosition) => void;
  copied: ComputedRef<boolean>;
}

const CopyStateInjectionKey = Symbol() as InjectionKey<CopyState>;

export function provideCopyState(
  selectionState: SelectionState,
  guitar: GuitarStore,
): CopyState {
  const copiedPositions = ref<NotePosition[]>([]);

  function copy() {
    copiedPositions.value = Array.from(selectionState.selections).map(
      notePositionKeyFromKey,
    );
  }

  function paste(targetPosition: NotePosition) {
    if (copiedPositions.value.length === 0) return;

    const positions = copiedPositions.value;
    // Calculate the bounds of copied notes to determine offset
    const minString = Math.min(...positions.map((p) => p.string));
    const minPosition = Math.min(...positions.map((p) => p.position));

    // Calculate deltas from target to source top-left corner
    const deltaString = targetPosition.string - minString;
    const deltaPosition = targetPosition.position - minPosition;

    // Move the notes with copy=true
    guitar.moveNotes(positions, deltaString, deltaPosition, true);
  }

  const copyState: CopyState = {
    copy,
    paste,
    copied: computed(() => copiedPositions.value.length > 0),
  };

  provide(CopyStateInjectionKey, copyState);

  return copyState;
}

export function injectCopyState() {
  return inject(CopyStateInjectionKey) as CopyState;
}
