import type { GuitarNote, NoteStack, TimeSignature } from "~/model/data";
import type { GuitarStack, TabStore } from "~/model/stores";

export type Bar = {
  start: number;
  end: number;
  stacks: GuitarStack[];
};

export interface BarManagementState {
  bars: Bar[];
  newBarStart: number;
  deleteBar: (start: number) => void;
  insertBar: (start: number) => number;
  reorderBar: (fromBarStart: number, to: number) => void;
  insertBreak: (start: number) => void;
  joinBreak: (start: number) => void;
  insertTimeChange: (start: number) => void;
  newBarClick: () => void;
  getTimeSignatureAt: (position: number, before?: boolean) => TimeSignature;
  getBarIndexAt: (position: number) => number;
}

const BarManagementInjectionKey = Symbol() as InjectionKey<BarManagementState>;

export function provideBarManagement(
  props: ReactiveComputed<{
    tabStore: TabStore;
    getSubUnitForPosition: (position: number) => number;
  }>,
) {
  const newBarStart = ref(0);

  // Helper function to calculate a bar's size at a specific position
  function getTimeSignatureAt(position: number, before: boolean = false) {
    if (props.tabStore.timeChanges.size === 0) {
      throw new Error("No time changes found");
    }

    // Sort all time change positions
    const timeChangePositions = [...props.tabStore.timeChanges.keys()].sort(
      (a, b) => a - b,
    );

    const condition = before
      ? (changePos: number) => changePos < position
      : (changePos: number) => changePos <= position;
    let timeSignature = props.tabStore.timeChanges.get(0)!;
    for (const changePos of timeChangePositions) {
      if (condition(changePos)) {
        timeSignature = props.tabStore.timeChanges.get(changePos)!;
      } else {
        break; // Stop once we've gone past our position
      }
    }

    return timeSignature;
  }

  function timeChangesEqual(a: TimeSignature, b: TimeSignature) {
    return a.beatsPerBar === b.beatsPerBar && a.beatSize === b.beatSize;
  }

  function getBarSizeAt(position: number, before: boolean = false) {
    const timeSignature = getTimeSignatureAt(position, before);
    return timeSignature.beatsPerBar * timeSignature.beatSize;
  }

  const bars = computed<Bar[]>(() => {
    if (!props.tabStore.guitar) return [];
    const bars: Bar[] = [];

    // Maximum position we need to consider
    const maxPosition = Math.max(
      newBarStart.value,
      props.tabStore.guitar.getLastPosition(),
    );

    // Start with position 0 and the default time signature
    let currentPosition = 0;

    // Create bars until we've covered all the tab content
    while (currentPosition <= maxPosition) {
      const barSize = getBarSizeAt(currentPosition);

      bars.push({
        start: currentPosition,
        end: currentPosition + barSize,
        stacks: props.tabStore.guitar.getStacks(
          currentPosition,
          currentPosition + barSize,
          props.getSubUnitForPosition(currentPosition),
        ),
      });

      currentPosition += barSize;
    }

    return bars;
  });

  function deleteBar(start: number) {
    const barSize = getBarSizeAt(start);
    props.tabStore.guitar.deleteStacks(start, start + barSize);
    props.tabStore.guitar.shiftFrom(start, -barSize);

    props.tabStore.timeChanges.delete(start);
    // Update time changes after this position
    const timeChangesToUpdate = new Map();
    for (const [pos, timeChange] of props.tabStore.timeChanges.entries()) {
      // should this be >=?
      if (pos > start) {
        timeChangesToUpdate.set(pos - barSize, timeChange);
        props.tabStore.timeChanges.delete(pos);
      }
    }

    // Apply the updates to time changes
    for (const [pos, timeChange] of timeChangesToUpdate.entries()) {
      props.tabStore.timeChanges.set(pos, timeChange);
    }
  }

  function shiftTimeChanges(start: number, shiftBy: number) {
    const timeChangesToUpdate = new Map();
    for (const [pos, timeChange] of props.tabStore.timeChanges.entries()) {
      if (pos >= start) {
        timeChangesToUpdate.set(pos + shiftBy, timeChange);
        props.tabStore.timeChanges.delete(pos);
      }
    }
    for (const [pos, timeChange] of timeChangesToUpdate.entries()) {
      props.tabStore.timeChanges.set(pos, timeChange);
    }

    if (!props.tabStore.timeChanges.has(0)) {
      props.tabStore.timeChanges.set(0, {
        beatsPerBar: 4,
        beatSize: SPACING.Quarter,
      });
    }
  }

  function insertBar(start: number) {
    const barSize = getBarSizeAt(start, true);
    props.tabStore.guitar.shiftFrom(start, barSize);

    shiftTimeChanges(start, barSize);

    printBars("after time change update");
    return barSize;
  }

  const printBars = (prefix: string) => {
    console.log(
      prefix,
      bars.value.map((b) => b.start),
    );
  };

  /*
  Example cases:
  1.
                          v------
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | (4/4) 7 8 9 10 -> (4/4) 0 1 2 3 | 7 8 9 10 | (3/4) 4 5 6
  2.
              -----v
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9 -> (3/4) 4 5 6 | (4/4) 0 1 2 3 | (3/4) 7 8 9
  3.
             v------------------
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9 -> (3/4) 7 8 9 | (4/4) 0 1 2 3 | (3/4) 4 5 6

  Let's look at example #1:
  Step 1: Shift notes by getBarSizeAt(from) (moving backward: insert before the "to" bar)
  (4/4) 0 1 2 3 | (3/4) - - - | (4/4) - 4 5 6 | 7 8 9 10 
  Step 2: Shift time changes at or after insertion point by getBarSizeAt(from)
  (4/4) 0 1 2 3 | - - - - | (3/4) 4 5 6 | (4/4) 7 8 9 10 
  Step 3: Determine and copy time signature from "from" bar to insertion point
  (4/4) 0 1 2 3 | (4/4) - - - - | (3/4) 4 5 6 | (4/4) 7 8 9 10 
  But this would be redundant, so leave it as before
  (4/4) 0 1 2 3 | - - - - | (3/4) 4 5 6 | (4/4) 7 8 9 10 
  Step 4: Restore implicit time change broken by the insertion (none)
  Step 5: Move notes
  (4/4) 0 1 2 3 | 7 8 9 10 | (3/4) 4 5 6 | (4/4) - - - - 
  Step 6: Delete original notes and time signature
  (4/4) 0 1 2 3 | 7 8 9 10 | (3/4) 4 5 6

  Example #2:
  Step 1: Shift notes by getBarSizeAt(from) (moving forward: insert after the "to" bar)
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | - - - | - 7 8 | 9
  Step 2: Shift time changes at or after insertion point by getBarSizeAt(from) (none)
  Step 3: Determine and copy time signature from "from" bar to insertion point
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | (4/4) - - - - | 7 8 9
  Step 4: Restore implicit time change broken by the insertion
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | (4/4) - - - - | (3/4) 7 8 9
  Step 5: Move notes
  (4/4) _ _ _ _ | (3/4) 4 5 6 | (4/4) 0 1 2 3 | (3/4) 7 8 9
  Step 6: Delete original notes and time signature
  (3/4) 4 5 6 | (4/4) 0 1 2 3 | (3/4) 7 8 9

  Example #3:
  Step 1: Shift notes by getBarSizeAt(from) (moving backward: insert before the "to" bar)
  (4/4) - - - 0 | (3/4) 1 2 3 | 4 5 6 | 7 8 9
  Step 2: Shift time changes at or after insertion point by getBarSizeAt(from)
  - - - (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9
  Step 3: Determine and copy time signature from "from" bar to insertion point
  (3/4) - - - (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9
  Step 4: Restore implicit time change broken by insertion (none)
  Step 5: Move notes
  (3/4) 7 8 9 | (4/4) 0 1 2 3 | (3/4) 4 5 6 | - - -
  Step 6: Delete original notes
  (3/4) 7 8 9 | (4/4) 0 1 2 3 | (3/4) 4 5 6

  Operation retains original bars, just moves them
  */

  function reorderBar(fromBarStart: number, to: number) {
    const fromSize = getBarSizeAt(fromBarStart);
    const toSize = getBarSizeAt(to);

    // Step 1: Shift notes by getBarSizeAt(from) (if moving backward: shift from before the "to" bar)
    const movingForward = to > fromBarStart;
    const insertionPoint = movingForward ? to + toSize : to;
    const shiftBy = fromSize;
    props.tabStore.guitar.shiftFrom(insertionPoint, shiftBy);

    // Step 2: Shift time changes at or after insertion point by getBarSizeAt(from)
    shiftTimeChanges(insertionPoint, shiftBy);
    const fromBarShiftedPos = movingForward
      ? fromBarStart
      : fromBarStart + shiftBy;

    // Step 3: Determine and copy time signature from "from" bar to insertion point
    const fromBarTimeSignature = getTimeSignatureAt(fromBarShiftedPos);
    const insertionTimeSignature = getTimeSignatureAt(insertionPoint);

    if (!timeChangesEqual(fromBarTimeSignature, insertionTimeSignature)) {
      props.tabStore.timeChanges.set(insertionPoint, fromBarTimeSignature);
    }
    //Step 4: Restore implicit time change broken by the insertion
    const afterInsertionTimeChange = props.tabStore.timeChanges.get(
      insertionPoint + shiftBy,
    );
    const beforeInsertionTimeSignature = getTimeSignatureAt(
      insertionPoint,
      true,
    );

    if (
      !afterInsertionTimeChange &&
      timeChangesEqual(beforeInsertionTimeSignature, insertionTimeSignature)
    ) {
      props.tabStore.timeChanges.set(
        insertionPoint + shiftBy,
        beforeInsertionTimeSignature,
      );
    }

    // Remove duplicate consecutive time change that could have been caused by Step 3 - if insertion bar and next bar are the same, remove time change in the next bar
    if (
      afterInsertionTimeChange &&
      timeChangesEqual(afterInsertionTimeChange, fromBarTimeSignature)
    ) {
      props.tabStore.timeChanges.delete(insertionPoint + shiftBy);
    }

    // Step 5: Move notes
    const notesToMove = props.tabStore.guitar
      .getStacks(fromBarShiftedPos, fromBarShiftedPos + fromSize)
      .flatMap((stack) =>
        stack.notes.map((note, i) => ({
          position: stack.position,
          string: i,
        })),
      );

    const moveDelta = to - fromBarStart + (movingForward ? toSize : -fromSize);
    props.tabStore.guitar.moveNotes(notesToMove, 0, moveDelta);

    // Step 6: Delete
    if (movingForward) {
      deleteBar(fromBarStart);
    } else {
      deleteBar(fromBarStart + shiftBy);
    }
  }

  function insertBreak(start: number) {
    props.tabStore.lineBreaks.add(start);
  }

  function joinBreak(start: number) {
    props.tabStore.lineBreaks.delete(start);
  }

  function insertTimeChange(start: number) {
    props.tabStore.timeChanges.set(
      start,
      Object.assign({}, props.tabStore.timeChanges.get(0)!),
    );
  }

  function newBarClick() {
    const lastBarStart = bars.value.at(-1)!.start;
    const lastBarSize = getBarSizeAt(lastBarStart);
    newBarStart.value = lastBarStart + lastBarSize;
  }

  function getBarIndexAt(position: number) {
    const index = bars.value.findIndex(
      (bar) => position >= bar.start && position < bar.end,
    );
    return index !== -1 ? index : bars.value.length - 1;
  }

  const state = reactiveComputed(() => ({
    bars,
    newBarStart,
    deleteBar,
    insertBar,
    reorderBar,
    insertBreak,
    joinBreak,
    newBarClick,
    insertTimeChange,
    getTimeSignatureAt,
    getBarIndexAt,
  }));

  provide(BarManagementInjectionKey, state);
  return state;
}

export function injectBarManagement() {
  return inject(BarManagementInjectionKey) as BarManagementState;
}
