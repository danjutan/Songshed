import type { GuitarNote } from "~/model/data";
import type { GuitarStore, NotePosition } from "~/model/stores";

export type NotePositionKey = `${number}-${number}`;
export const notePositionKey = (position: NotePosition): NotePositionKey =>
  `${position.string}-${position.position}`;
export const notePositionKeyFromKey = (key: NotePositionKey): NotePosition => {
  const [string, position] = key.split("-").map(Number);
  return { string, position };
};
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
  selections: Set<NotePositionKey>;
  regions: RegionBounds[];

  selectNote: (position: NotePosition) => void;
  clearSelections: () => void;
  deleteSelectedNotes: () => void;

  startSelection: (position: NotePosition) => void;
  growSelection: (position: NotePosition) => void;
  endSelection: () => void;

  isSelectedPosition: (position: NotePosition) => boolean;
  isEmpty: () => boolean;

  movingOffset: { deltaString: number; deltaPosition: number };
  startMove: (origin: NotePosition) => void;
  moveOver: (moveTo: NotePosition) => void;
  endMove: (copy?: boolean) => void;
  cancelMove: () => void;

  action: SelectionAction;
  setAction: (action: SelectionAction) => void;
}

export function provideSelectionState(
  props: ReactiveComputed<{
    guitar: GuitarStore;
    subUnit: number;
    getBarIndexAt: (position: number) => number;
  }>,
): SelectionState {
  let currentSelectionStart: NotePosition | undefined;
  let currentSelectionEnd: NotePosition | undefined;

  const selections = reactive<Set<NotePositionKey>>(new Set());
  const selectedPositions = reactiveComputed<NotePosition[]>(() => {
    return Array.from(selections).map((key) => {
      return notePositionKeyFromKey(key);
    });
  });

  const action = ref<SelectionAction>("none");

  function selectNote(position: NotePosition) {
    selections.add(notePositionKey(position));
  }

  function unselectNote(position: NotePosition) {
    selections.delete(notePositionKey(position));
  }

  const regions = reactiveComputed<RegionBounds[]>(() => {
    const selected = selectedPositions; // Get all selected positions
    const visited = new Set<NotePositionKey>();
    const outputRegions: RegionBounds[] = [];

    function areAdjacent(note1: NotePosition, note2: NotePosition): boolean {
      return (
        Math.abs(note1.string - note2.string) <= 1 &&
        Math.abs(note1.position - note2.position) <= props.subUnit
      );
    }

    function isCrossingBar(position1: number, position2: number): boolean {
      return props.getBarIndexAt(position1) !== props.getBarIndexAt(position2);
    }

    function findRegion(start: NotePosition): NotePosition[] {
      const stack = [start];
      const region: NotePosition[] = [];

      while (stack.length > 0) {
        const current = stack.pop()!;
        const key = notePositionKey(current);
        if (visited.has(key)) continue;

        visited.add(key);
        region.push(current);

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

    for (const note of selected) {
      const key = notePositionKey(note);
      if (visited.has(key)) continue;

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

  function isEmpty(): boolean {
    if (!props.guitar) return true;
    return selectedPositions
      .map(props.guitar.getNote)
      .every((note) => note === undefined);
  }

  function startSelection(position: NotePosition): void {
    currentSelectionStart = position;
    currentSelectionEnd = position;
  }

  function endSelection(): void {
    currentSelectionStart = undefined;
    currentSelectionEnd = undefined;
  }

  function growSelection(position: NotePosition): void {
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
        selectNote({ string, position });
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
        unselectNote({ string, position });
      }
    }
  }

  function clearSelections(): void {
    for (const position of [...selectedPositions]) {
      unselectNote(position);
    }
  }

  function isSelectedPosition(position: NotePosition): boolean {
    return selections.has(notePositionKey(position));
  }

  const movingOffset = reactive({
    deltaString: 0,
    deltaPosition: 0,
  });
  let lastMoveTo: NotePosition;

  function startMove(origin: NotePosition): void {
    const bounds = getFilledBounds();
    if (!bounds) return;

    movingOffset.deltaString = origin.string - bounds.minString;
    movingOffset.deltaPosition = 0;

    lastMoveTo = origin;
    action.value = "moving";
  }

  function moveOver(moveTo: NotePosition): void {
    const bounds = getFilledBounds();
    if (!bounds) return;

    const { minString, maxString, minPosition } = bounds;
    const { deltaString, deltaPosition } = movingOffset;

    const stringDiff = moveTo.string - lastMoveTo.string;
    const positionDiff = moveTo.position - lastMoveTo.position;

    if (
      minString + deltaString + stringDiff < 0 ||
      maxString + deltaString + stringDiff >= props.guitar.tuning.length ||
      minPosition + deltaPosition + positionDiff < 0
    ) {
      return;
    }

    movingOffset.deltaString += stringDiff;
    movingOffset.deltaPosition += positionDiff;

    lastMoveTo = moveTo;
  }

  function cancelMove(): void {
    action.value = "none";
  }

  function endMove(copy?: boolean): void {
    action.value = "none";

    const stringDiff = movingOffset.deltaString;
    const positionDiff = movingOffset.deltaPosition;

    const movedPositions = props.guitar.moveNotes(
      selectedPositions,
      stringDiff,
      positionDiff,
      copy,
    );

    clearSelections();

    for (const position of movedPositions) {
      selectNote(position);
    }
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

  function getFilledBounds(): RegionBounds | undefined {
    if (selectedPositions.length === 0) return;

    const selectedWithNotes = selectedPositions
      .filter((pos) => props.guitar.getNote(pos))
      .map((pos) => ({
        string: pos.string,
        position: pos.position,
      }));

    return {
      minString: Math.min(...selectedWithNotes.map((p) => p.string)),
      maxString: Math.max(...selectedWithNotes.map((p) => p.string)),
      minPosition: Math.min(...selectedWithNotes.map((p) => p.position)),
      maxPosition: Math.max(...selectedWithNotes.map((p) => p.position)),
    };
  }

  const selectionState: SelectionState = {
    selections,
    selectNote,
    startSelection,
    endSelection,
    growSelection,
    clearSelections,
    isSelectedPosition,
    isEmpty,
    startMove,
    endMove,
    deleteSelectedNotes,
    regions,
    moveOver,
    cancelMove,
    movingOffset,
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
