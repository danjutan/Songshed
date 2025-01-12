import type { GuitarNote } from "~/model/data";
import type { GuitarStore, NotePosition } from "~/model/stores";

type NotePositionKey = `${number}-${number}`;
export const notePositionKey = (position: NotePosition): NotePositionKey =>
  `${position.string}-${position.position}`;

// The rectangular boundary of a contiguous set of selected notes.
export interface RegionBounds {
  minPosition: number;
  maxPosition: number;
  minString: number;
  maxString: number;
}

export function isWithinRegion(
  position: NotePosition,
  region: RegionBounds,
): boolean {
  return (
    position.string >= region.minString &&
    position.string <= region.maxString &&
    position.position >= region.minPosition &&
    position.position <= region.maxPosition
  );
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

type SelectionAction = "might-delete" | "might-move" | "moving" | "none";

export interface SelectionState {
  selectedPositions: NotePosition[];
  toggleNote: (position: NotePosition) => void;
  startSelection: (position: NotePosition) => void;
  endSelection: () => void;
  addSelection: (position: NotePosition) => void;
  clearSelections: () => void;
  isSelected: (position: NotePosition) => boolean;
  selectNote: (position: NotePosition) => void;
  startMove: (origin: NotePosition) => void;
  endMove: (moveTo: NotePosition, copy?: boolean) => void;
  // moveSelectionsIfValid: (moveTo: NotePosition) => void;
  deleteSelectedNotes: () => void;
  setAction: (action: SelectionAction) => void;
  action: SelectionAction;
  regions: RegionBounds[];
}

export function provideSelectionState(
  props: ReactiveComputed<{
    guitar: GuitarStore | undefined;
    subUnit: number;
    barSize: number;
  }>,
): SelectionState {
  let currentSelectionStart: NotePosition | undefined;
  let currentSelectionEnd: NotePosition | undefined;

  const action = ref<SelectionAction>("none");
  let moveAnchor: NotePosition | undefined;

  const selections = reactive<Set<NotePositionKey>>(new Set());
  const selectedPositions = reactiveComputed<NotePosition[]>(() => {
    return Array.from(selections).map((key) => {
      const [string, position] = key.split("-").map(Number);
      return { string, position };
    });
  });

  const regions = reactiveComputed<RegionBounds[]>(() => {
    const selected = selectedPositions; // Get all selected positions
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

  function isSelected(position: NotePosition): boolean {
    return selections.has(notePositionKey(position));
  }

  function startMove(origin: NotePosition): void {
    moveAnchor = origin;
  }

  // function endMove(): void {
  //   moveAnchor = undefined;
  //   action.value = "none";
  // }

  function endMove(moveTo: NotePosition, copy?: boolean): void {
    action.value = "none";
    const guitar = props.guitar;
    if (!guitar || !moveAnchor) return;

    const stringDiff = moveTo.string - moveAnchor.string;
    const positionDiff = moveTo.position - moveAnchor.position;

    if (stringDiff < 0) {
      const minString = Math.min(...selectedPositions.map((p) => p.string));
      if (minString + stringDiff < 0) {
        return;
      }
    }

    if (stringDiff > 0) {
      const maxString = Math.max(...selectedPositions.map((p) => p.string));
      if (maxString + stringDiff >= guitar.strings) {
        return;
      }
    }

    if (positionDiff < 0) {
      const minPosition = Math.min(...selectedPositions.map((p) => p.position));
      if (minPosition + positionDiff < 0) {
        return;
      }
    }

    const selectedNotes = selectedPositions
      .map((pos) => ({
        notePosition: pos,
        note: guitar.getNote(pos),
      }))
      .filter(
        (item): item is { notePosition: NotePosition; note: GuitarNote } =>
          item.note !== undefined,
      );

    if (!copy) {
      selectedNotes
        .map(({ notePosition }) => notePosition)
        .forEach(guitar.deleteNote);
    }

    for (const { notePosition, note } of selectedNotes) {
      const newPos = {
        string: notePosition.string + stringDiff,
        position: notePosition.position + positionDiff,
      };
      if (note.note === "muted") {
        guitar.setNote(newPos, { note: "muted" });
        continue;
      }
      const newMidi = (note.note +
        (guitar.tuning[newPos.string] -
          guitar.tuning[notePosition.string])) as Midi;
      guitar.setNote(newPos, { note: newMidi });
    }

    clearSelections();
    for (const { notePosition } of selectedNotes) {
      selections.add(
        notePositionKey({
          string: notePosition.string + stringDiff,
          position: notePosition.position + positionDiff,
        }),
      );
    }
    moveAnchor = moveTo;
  }

  function deleteSelectedNotes(): void {
    const guitar = props.guitar;
    if (!guitar) return;

    for (const position of selectedPositions) {
      guitar.deleteNote(position);
    }

    clearSelections();
    action.value = "none";
  }

  const selectionState: SelectionState = {
    selectedPositions,
    toggleNote,
    selectNote,
    startSelection,
    endSelection,
    addSelection,
    clearSelections,
    isSelected,
    startMove,
    endMove,
    deleteSelectedNotes,
    regions,
    get action() {
      return action.value;
    },
    setAction: (value: SelectionAction) => {
      action.value = value;
    },
  };

  provide(SelectionInjectionKey, selectionState);
  return selectionState;
}

const SelectionInjectionKey = Symbol() as InjectionKey<SelectionState>;

export function injectSelectionState(): SelectionState {
  return inject(SelectionInjectionKey) as SelectionState;
}
