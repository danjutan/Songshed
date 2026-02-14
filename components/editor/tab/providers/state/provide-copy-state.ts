import type { GuitarStore, NotePosition } from "~/model/stores";
import {
  notePositionKeyFromKey,
  type NotePositionKey,
  type SelectionState,
} from "~/components/editor/tab/providers/state/provide-selection-state";

export interface CopyState {
  copy: () => void;
  pasteHover: (targetPosition: NotePosition) => void;
  pasteHoverLeave: () => void;
  paste: (targetPosition: NotePosition) => void;
  pasteDelta: ComputedRef<NotePosition | undefined>;
  copiedPositions: ComputedRef<NotePosition[]>;
  copied: ComputedRef<boolean>;
}

const CopyStateInjectionKey = Symbol() as InjectionKey<CopyState>;

export function provideCopyState(
  selectionState: SelectionState,
  guitar: GuitarStore,
): CopyState {
  const copiedPositions = ref<NotePosition[]>([]);
  const pastePosition = ref<NotePosition | undefined>(undefined);
  function copy() {
    copiedPositions.value = Array.from(selectionState.selections).map(
      notePositionKeyFromKey,
    );
  }

  function pasteHover(targetPosition: NotePosition) {
    pastePosition.value = targetPosition;
  }

  function pasteHoverLeave() {
    pastePosition.value = undefined;
  }

  const pasteDelta = computed(() => {
    if (!pastePosition.value) {
      return;
    }

    const minString = Math.min(...copiedPositions.value.map((p) => p.string));
    const minPosition = Math.min(
      ...copiedPositions.value.map((p) => p.position),
    );

    return {
      string: pastePosition.value.string - minString,
      position: pastePosition.value.position - minPosition,
    };
  });

  function paste() {
    const delta = pasteDelta.value;

    if (copiedPositions.value.length === 0 || !delta) return;

    const newPositions = guitar.moveNotes(
      copiedPositions.value,
      delta.string,
      delta.position,
      true,
    );

    selectionState.clearSelections(); // not needed; just in case

    for (const position of newPositions) {
      selectionState.selectNote(position);
    }

    pastePosition.value = undefined;
  }

  const copyState: CopyState = {
    copy,
    pasteHover,
    pasteHoverLeave,
    paste,
    pasteDelta,
    copiedPositions: computed(() => copiedPositions.value),
    copied: computed(() => copiedPositions.value.length > 0),
  };

  provide(CopyStateInjectionKey, copyState);

  return copyState;
}

export function injectCopyState() {
  return inject(CopyStateInjectionKey) as CopyState;
}
