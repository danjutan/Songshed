import type { GuitarStore } from "~/model/stores";

interface NotePosition {
  position: number;
  string: number;
}

type NotePositionKey = `${number}-${number}`;
export const notePositionKey = (position: NotePosition): NotePositionKey =>
  `${position.string}-${position.position}`;

// The rectangular boundary of a contiguous set of selected notes.
interface RegionBounds {
  minPosition: number;
  maxPosition: number;
  minString: number;
  maxString: number;
}

// type RegionBoundsKey = `${number}-${number}-${number}-${number}`;
// export const regionBoundsKey = (bounds: RegionBounds): RegionBoundsKey =>
//   `${bounds.minString}-${bounds.maxString}-${bounds.minPosition}-${bounds.maxPosition}`;

function getRegionBounds(start: NotePosition, end: NotePosition): RegionBounds {
  return {
    minString: Math.min(start.string, end.string),
    maxString: Math.max(start.string, end.string),
    minPosition: Math.min(start.position, end.position),
    maxPosition: Math.max(start.position, end.position),
  };
}

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
    barSize: number;
  }>,
): SelectionState {
  const selections = reactive<Set<NotePositionKey>>(new Set());
  const selectedPositions = computed<NotePosition[]>(() => {
    return Array.from(selections).map((key) => {
      const [string, position] = key.split("-").map(Number);
      return { string, position };
    });
  });

  const regions = computed<RegionBounds[]>(() => {
    const selected = selectedPositions.value; // Get all selected positions
    const visited = new Set<NotePositionKey>();
    const outputRegions: RegionBounds[] = [];

    // Helper to check adjacency
    function areAdjacent(note1: NotePosition, note2: NotePosition): boolean {
      return (
        Math.abs(note1.string - note2.string) <= 1 &&
        Math.abs(note1.position - note2.position) <= props.subUnit
      );
    }

    // Helper to check if two positions cross a bar line
    function isCrossingBar(position1: number, position2: number): boolean {
      const barIndex1 = Math.floor(position1 / props.barSize);
      const barIndex2 = Math.floor(position2 / props.barSize);
      return barIndex1 !== barIndex2;
    }

    // Flood-fill algorithm to find regions
    function findRegion(start: NotePosition): NotePosition[] {
      const stack = [start];
      const region: NotePosition[] = [];

      while (stack.length > 0) {
        const current = stack.pop()!;
        const key = notePositionKey(current);
        if (visited.has(key)) continue;

        visited.add(key);
        region.push(current);

        // Add adjacent positions
        for (const other of selected) {
          const otherKey = notePositionKey(other);
          if (
            !visited.has(otherKey) &&
            areAdjacent(current, other) &&
            !isCrossingBar(current.position, other.position)
          ) {
            stack.push(other);
          }
        }
      }

      return region;
    }

    // Process each selected note
    for (const note of selected) {
      const key = notePositionKey(note);
      if (visited.has(key)) continue;

      // Find a region and compute its bounds
      const region = findRegion(note);
      const strings = region.map((n) => n.string);
      const positions = region.map((n) => n.position);

      outputRegions.push({
        minString: Math.min(...strings),
        maxString: Math.max(...strings),
        minPosition: Math.min(...positions),
        maxPosition: Math.max(...positions),
      });
    }

    return outputRegions;
  });

  let currentSelectionStart: NotePosition | undefined;
  let currentSelectionEnd: NotePosition | undefined;

  function toggleNote(position: NotePosition) {
    if (selections.has(notePositionKey(position))) {
      selections.delete(notePositionKey(position));
      return;
    }
    selections.add(notePositionKey(position));
  }

  function selectNote(position: NotePosition) {
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
    clearSelection(getRegionBounds(currentSelectionStart, currentSelectionEnd));

    const bounds = getRegionBounds(currentSelectionStart, position);
    for (let string = bounds.minString; string <= bounds.maxString; string++) {
      for (
        let position = bounds.minPosition;
        position <= bounds.maxPosition;
        position += props.subUnit
      ) {
        selections.add(notePositionKey({ string, position }));
      }
    }
    currentSelectionEnd = position;
  }

  function clearSelection(bounds: RegionBounds): void {
    for (let string = bounds.minString; string <= bounds.maxString; string++) {
      for (
        let position = bounds.minPosition;
        position <= bounds.maxPosition;
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

    if (stringDiff < 0) {
      const minString = Math.min(
        ...selectedPositions.value.map((p) => p.string),
      );
      if (minString + stringDiff < 0) {
        return;
      }
    }

    if (stringDiff > 0) {
      const maxString = Math.max(
        ...selectedPositions.value.map((p) => p.string),
      );
      if (maxString + stringDiff > guitar.strings) {
        return;
      }
    }

    if (positionDiff < 0) {
      const minPosition = Math.min(
        ...selectedPositions.value.map((p) => p.position),
      );
      if (minPosition + positionDiff < 0) {
        return;
      }
    }

    // Clear current selections
    selections.clear();

    // Add new shifted positions
    for (const pos of selectedPositions.value) {
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
