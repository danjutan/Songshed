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
  getBarIndexAt: (position: number) => number;
}

const BarManagementInjectionKey = Symbol() as InjectionKey<BarManagementState>;

export function provideBarManagement(
  tabStore: TabStore,
  getSubUnitForPosition: (position: number) => number,
  getTimeSignatureAt: (position: number, before?: boolean) => TimeSignature,
) {
  const newBarStart = ref(0);

  function timeChangesEqual(a: TimeSignature, b: TimeSignature) {
    return a.beatsPerBar === b.beatsPerBar && a.beatSize === b.beatSize;
  }

  function getBarSizeAt(position: number, before: boolean = false) {
    const timeSignature = getTimeSignatureAt(position, before);
    return timeSignature.beatsPerBar * timeSignature.beatSize;
  }

  const bars = computed<Bar[]>(() => {
    if (!tabStore.guitar) return [];
    const bars: Bar[] = [];

    // Maximum position we need to consider
    const maxPosition = Math.max(
      newBarStart.value,
      tabStore.guitar.getLastPosition(),
    );

    // Start with position 0 and the default time signature
    let currentPosition = 0;

    // Create bars until we've covered all the tab content
    while (currentPosition <= maxPosition) {
      const barSize = getBarSizeAt(currentPosition);

      bars.push({
        start: currentPosition,
        end: currentPosition + barSize,
        stacks: tabStore.guitar.getStacks(
          currentPosition,
          currentPosition + barSize,
          getSubUnitForPosition(currentPosition),
        ),
      });

      currentPosition += barSize;
    }

    return bars;
  });

  function deleteBar(start: number) {
    const barSize = getBarSizeAt(start);
    tabStore.guitar.deleteStacks(start, start + barSize);
    tabStore.guitar.shiftFrom(start, -barSize);

    tabStore.timeChanges.delete(start);
    // Update time changes after this position
    const timeChangesToUpdate = new Map();
    for (const [pos, timeChange] of tabStore.timeChanges.entries()) {
      // should this be >=?
      if (pos > start) {
        timeChangesToUpdate.set(pos - barSize, timeChange);
        tabStore.timeChanges.delete(pos);
      }
    }

    // Apply the updates to time changes
    for (const [pos, timeChange] of timeChangesToUpdate.entries()) {
      tabStore.timeChanges.set(pos, timeChange);
    }
  }

  function shiftTimeChanges(start: number, shiftBy: number) {
    const timeChangesToUpdate = new Map();
    for (const [pos, timeChange] of tabStore.timeChanges.entries()) {
      if (pos >= start) {
        timeChangesToUpdate.set(pos + shiftBy, timeChange);
        tabStore.timeChanges.delete(pos);
      }
    }
    for (const [pos, timeChange] of timeChangesToUpdate.entries()) {
      tabStore.timeChanges.set(pos, timeChange);
    }

    if (!tabStore.timeChanges.has(0)) {
      tabStore.timeChanges.set(0, {
        beatsPerBar: 4,
        beatSize: SPACING.Quarter,
      });
    }
  }

  function insertBar(start: number) {
    const barSize = getBarSizeAt(start, true);
    tabStore.guitar.shiftFrom(start, barSize);

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
    tabStore.guitar.shiftFrom(insertionPoint, shiftBy);

    // Step 2: Shift time changes at or after insertion point by getBarSizeAt(from)
    shiftTimeChanges(insertionPoint, shiftBy);
    const fromBarShiftedPos = movingForward
      ? fromBarStart
      : fromBarStart + shiftBy;

    // Step 3: Determine and copy time signature from "from" bar to insertion point
    const fromBarTimeSignature = getTimeSignatureAt(fromBarShiftedPos);
    const insertionTimeSignature = getTimeSignatureAt(insertionPoint);

    if (!timeChangesEqual(fromBarTimeSignature, insertionTimeSignature)) {
      tabStore.timeChanges.set(insertionPoint, fromBarTimeSignature);

      //Step 4: Restore implicit time change broken by the insertion
      const afterInsertionPointTimeChange = tabStore.timeChanges.get(
        insertionPoint + shiftBy,
      );
      const beforeInsertionPointTimeSignature = getTimeSignatureAt(
        insertionPoint,
        true,
      );

      if (
        !afterInsertionPointTimeChange &&
        timeChangesEqual(
          beforeInsertionPointTimeSignature,
          insertionTimeSignature,
        )
      ) {
        tabStore.timeChanges.set(
          insertionPoint + shiftBy,
          beforeInsertionPointTimeSignature,
        );
      }

      // Remove duplicate consecutive time change that could have been caused by Step 3 - if insertion bar and next bar are the same, remove time change in the next bar
      if (
        afterInsertionPointTimeChange &&
        timeChangesEqual(afterInsertionPointTimeChange, fromBarTimeSignature)
      ) {
        tabStore.timeChanges.delete(insertionPoint + shiftBy);
      }
    }

    // Step 5: Move notes
    const notesToMove = tabStore.guitar
      .getStacks(fromBarShiftedPos, fromBarShiftedPos + fromSize)
      .flatMap((stack) =>
        stack.notes.map((note, i) => ({
          position: stack.position,
          string: i,
        })),
      );

    const moveDelta = to - fromBarStart + (movingForward ? toSize : -fromSize);
    tabStore.guitar.moveNotes(notesToMove, 0, moveDelta);

    // Step 6: Delete
    if (movingForward) {
      deleteBar(fromBarStart);
    } else {
      deleteBar(fromBarStart + shiftBy);
    }
  }

  function insertBreak(start: number) {
    tabStore.lineBreaks.add(start);
  }

  function joinBreak(start: number) {
    tabStore.lineBreaks.delete(start);
  }

  function insertTimeChange(start: number) {
    tabStore.timeChanges.set(
      start,
      Object.assign({}, tabStore.timeChanges.get(0)!),
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
    getBarIndexAt,
  }));

  provide(BarManagementInjectionKey, state);
  return state;
}

export function injectBarManagement() {
  return inject(BarManagementInjectionKey) as BarManagementState;
}
