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
  toggleNote: (position: NotePosition) => void;
  startSelection: (position: NotePosition) => void;
  endSelection: () => void;
  addSelection: (position: NotePosition) => void;
  clearSelections: () => void;
  isSelected: (position: NotePosition) => boolean;
  moveSelectionsIfValid: (anchor: NotePosition, moveTo: NotePosition) => void;
  selectNote: (position: NotePosition) => void;
}

export function provideSelectionState(
  props: ReactiveComputed<{
    guitar: GuitarStore | undefined;
    subUnit: number;
  }>,
): SelectionState {
  const selections = reactive<Set<NotePositionKey>>(new Set());
  let currentSelectionStart: NotePosition | undefined;
  let currentSelectionEnd: NotePosition | undefined;

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

  function startSelection(position: NotePosition): void {
    currentSelectionStart = position;
    currentSelectionEnd = position;
  }

  function endSelection(): void {
    currentSelectionStart = undefined;
    currentSelectionEnd = undefined;
  }

  function addSelection(position: NotePosition): void {
    if (!currentSelectionStart || !currentSelectionEnd) {
      return;
    }
    clearSelection({ start: currentSelectionStart, end: currentSelectionEnd });
    const minString = Math.min(currentSelectionStart.string, position.string);
    const maxString = Math.max(currentSelectionStart.string, position.string);
    const minPosition = Math.min(
      currentSelectionStart.position,
      position.position,
    );
    const maxPosition = Math.max(
      currentSelectionStart.position,
      position.position,
    );

    for (let string = minString; string <= maxString; string++) {
      for (
        let position = minPosition;
        position <= maxPosition;
        position += props.subUnit
      ) {
        selections.add(notePositionKey({ string, position }));
      }
    }
    currentSelectionEnd = position;
  }

  function clearSelection(selection: Selection): void {
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
      for (
        let position = minPosition;
        position <= maxPosition;
        position += props.subUnit
      ) {
        selections.delete(notePositionKey({ string, position }));
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
    const guitar = props.guitar;
    if (!guitar) return;
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
      if (maxString + stringDiff > guitar.strings) {
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
      guitar.moveNote(pos, {
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
    startSelection,
    endSelection,
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
