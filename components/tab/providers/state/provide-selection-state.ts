import type { GuitarStore } from "~/model/stores";

interface NotePosition {
  position: number;
  string: number;
}
interface Selection {
  start: NotePosition;
  end: NotePosition;
}

type NotePositionKey = `${number}-${number}`;
export const notePositionKey = (position: NotePosition): NotePositionKey =>
  `${position.string}-${position.position}`;

export interface SelectionState {
  selections: Set<NotePositionKey>;
  toggleNote: (position: NotePosition) => void;
  addSelection: (selection: Selection) => void;
  clearSelections: () => void;
  isSelected: (position: NotePosition) => boolean;
  moveSelectionsIfValid: (anchor: NotePosition, moveTo: NotePosition) => void;
  selectNote: (position: NotePosition) => void;
}

export function provideSelectionState(
  guitar: ComputedRef<GuitarStore | undefined>,
): SelectionState {
  const selections = reactive<Set<NotePositionKey>>(new Set());

  function toggleNote(position: NotePosition) {
    if (selections.has(notePositionKey(position))) {
      selections.delete(notePositionKey(position));
      return;
    }
    selections.add(notePositionKey(position));
  }

  function selectNote(position: NotePosition): void {
    selections.add(notePositionKey(position));
  }

  function addSelection(selection: Selection): void {
    const minString = Math.min(selection.start.string, selection.end.string);
    const maxString = Math.max(selection.start.string, selection.end.string);
    const minPosition = Math.min(
      selection.start.position,
      selection.end.position,
    );
    const maxPosition = Math.max(
      selection.start.position,
      selection.end.position,
    );

    for (let string = minString; string <= maxString; string++) {
      for (let position = minPosition; position <= maxPosition; position++) {
        selections.add(notePositionKey({ string, position }));
      }
    }
  }

  function clearSelections(): void {
    selections.clear();
  }

  // function inSelection(position: NotePosition, selection: Selection): boolean {
  //   const minString = Math.min(selection.start.string, selection.end.string);
  //   const maxString = Math.max(selection.start.string, selection.end.string);
  //   const minPosition = Math.min(
  //     selection.start.position,
  //     selection.end.position,
  //   );
  //   const maxPosition = Math.max(
  //     selection.start.position,
  //     selection.end.position,
  //   );

  //   return (
  //     position.string >= minString &&
  //     position.string <= maxString &&
  //     position.position >= minPosition &&
  //     position.position <= maxPosition
  //   );
  // }

  function isSelected(position: NotePosition): boolean {
    return selections.has(notePositionKey(position));
  }

  function moveSelectionsIfValid(
    anchor: NotePosition,
    moveTo: NotePosition,
  ): void {
    if (!guitar.value) return;
    const stringDiff = moveTo.string - anchor.string;
    const positionDiff = moveTo.position - anchor.position;

    // Get all selected positions
    const selectedPositions = Array.from(selections).map((key) => {
      const [string, position] = key.split("-").map(Number);
      return { string, position };
    });

    if (stringDiff < 0) {
      const minString = Math.min(...selectedPositions.map((p) => p.string));
      if (minString + stringDiff < 0) {
        return;
      }
    }

    if (stringDiff > 0) {
      const maxString = Math.max(...selectedPositions.map((p) => p.string));
      if (maxString + stringDiff > guitar.value.strings) {
        return;
      }
    }

    if (positionDiff < 0) {
      const minPosition = Math.min(...selectedPositions.map((p) => p.position));
      if (minPosition + positionDiff < 0) {
        return;
      }
    }

    // Clear current selections
    selections.clear();

    // Add new shifted positions
    for (const pos of selectedPositions) {
      guitar.value.moveNote(pos, {
        string: pos.string + stringDiff,
        position: pos.position + positionDiff,
      });
      selections.add(
        notePositionKey({
          string: pos.string + stringDiff,
          position: pos.position + positionDiff,
        }),
      );
    }
  }

  const selectionState: SelectionState = {
    toggleNote,
    selectNote,
    selections,
    addSelection,
    clearSelections,
    isSelected,
    moveSelectionsIfValid,
  };

  provide(SelectionInjectionKey, selectionState);
  return selectionState;
}

const SelectionInjectionKey = Symbol() as InjectionKey<SelectionState>;

export function injectSelectionState(): SelectionState {
  return inject(SelectionInjectionKey) as SelectionState;
}
