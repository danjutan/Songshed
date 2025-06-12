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
    subUnit: number;
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
          props.subUnit,
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
        v-----
  0 1 2 3 | (3/4) 4 5 6 | 7 8 9 -> (3/4) 4 5 6 | (4/4) 0 1 2 3 | (3/4) 7 8 9
  2.
        -----v
  0 1 2 3 | (3/4) 4 5 6 | 7 8 9 -> (3/4) 4 5 6 | (4/4) 0 1 2 3 | (3/4) 7 8 9
  3.
        v------------------
  0 1 2 3 | (3/4) 4 5 6 | 7 8 9 -> (3/4) 7 8 9 | (4/4) 0 1 2 3 | (3/4) 4 5 6

  Let's look at example #2:
  Step 0: Implicit (4/4)
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9
  Step 1.1: Shift notes by getBarSizeAt(from) (moving forward: insert after the to bar)
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | - - - | - 7 8 | 9
  Step 1.2: Shift time changes after insertion point by getBarSizeAt(from) (none)
  Step 1.3: Restore implicit time change broken by the insertion
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | - - - | (3/4) - 7 8 | 9
  Step 2: 

  Example #3:
  Step 0: Implicit (4/4):
  (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9
  Step 1.1: Shift notes by getBarSizeAt(from) (moving backward: insert before the to bar)
  (4/4) - - - 0 | (3/4) 1 2 3 | 4 5 6 | 7 8 9
  Step 1.2: Shift time changes after insertion point by getBarSizeAt(from)
  - - - (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9
  Step 1.3: Restore implicit time change broken by the insertion (none)
  Step 2: Determine and move time signature
  (3/4) - - - (4/4) 0 1 2 3 | (3/4) 4 5 6 | 7 8 9
  Step 3: Move notes
  (3/4) 7 8 9 | (4/4) 0 1 2 3 | (3/4) 4 5 6 | - - -
  Step 4: Delete original notes
  (3/4) 7 8 9 | (4/4) 0 1 2 3 | (3/4) 4 5 6

  Operation retains original bars, just moves them
  */

  function reorderBar(fromBarStart: number, to: number) {
    console.log("moving", fromBarStart, "to", to);
    printBars("before");
    // const timeChangeAtFrom = props.tabStore.timeChanges.get(fromBarStart);
    // if (timeChange) {
    //   console.log("deleting time change at", fromBarStart);
    //   props.tabStore.timeChanges.delete(fromBarStart);
    //   printBars("after deleting time change");
    // }
    const fromSize = getBarSizeAt(fromBarStart);
    const toSize = getBarSizeAt(to);

    console.log("fromSize", fromSize, "toSize", toSize);
    const movingForward = to > fromBarStart;
    const insertAt = movingForward ? to + toSize : to;
    const shiftBy = fromSize;
    props.tabStore.guitar.shiftFrom(insertAt, shiftBy);
    shiftTimeChanges(insertAt, shiftBy);
    printBars("inserted");
    const fromBarShiftedPos = movingForward
      ? fromBarStart
      : fromBarStart + shiftBy;

    // const fromBar = bars.value.find((b) => b.start === fromBarShiftedPos)!;
    const notesToMove = props.tabStore.guitar
      .getStacks(fromBarShiftedPos, fromBarShiftedPos + fromSize)
      .flatMap((stack) =>
        stack.notes.map((note, i) => ({
          position: stack.position,
          string: i,
        })),
      );
    // const notesToMove = fromBar.stacks.flatMap((stack) =>
    //   stack.notes.map((note, i) => ({
    //     position: stack.position,
    //     string: i,
    //   })),
    // );
    const fromBarTimeChange = props.tabStore.timeChanges.get(fromBarShiftedPos);
    if (fromBarTimeChange) {
      props.tabStore.timeChanges.set(to, fromBarTimeChange);
      props.tabStore.timeChanges.delete(fromBarShiftedPos);
    }
    const moveDelta = to - fromBarStart + (movingForward ? toSize : -fromSize);
    props.tabStore.guitar.moveNotes(notesToMove, 0, moveDelta);
    printBars("moved");
    // if (!movingForward) {
    //   console.log("time changes before shift", props.tabStore.timeChanges);
    //   shiftTimeChanges(to, getBarSizeAt(to, true));
    //   console.log("time changes after shift", props.tabStore.timeChanges);
    // }
    if (movingForward) {
      deleteBar(fromBarStart);
    } else {
      deleteBar(fromBarStart + shiftBy);
    }
    printBars("deleted");
    // if (timeChange) {
    //   console.log("time changes before set", props.tabStore.timeChanges);
    //   console.log("setting time change", timeChange, "at", to);
    //   props.tabStore.timeChanges.set(to, timeChange);
    // }
    // printBars("time change");
    // // Moving forwards
    // if (to > fromBarStart) {
    //   const timeChange = props.tabStore.timeChanges.get(fromBarStart);
    //   const shiftedBy = insertBar(to - getBarSizeAt(to - getBarSizeAt(to)));
    //   const nextBar = bars.value.find((b) => b.start === to + shiftedBy)!;
    //   const notesToMove = nextBar.stacks.flatMap((stack) =>
    //     stack.notes.map((note, i) => ({
    //       position: stack.position,
    //       string: i,
    //     })),
    //   );
    //   props.tabStore.guitar.moveNotes(notesToMove, 0, -shiftedBy - shiftedBy);
    //   deleteBar(to + shiftedBy);
    //   if (timeChange) {
    //     props.tabStore.timeChanges.set(to, timeChange);
    //   }
    //   return to + shiftedBy;
    // } else {
    //   const timeChange = props.tabStore.timeChanges.get(fromBarStart);
    //   const shiftedBy = insertBar(to);
    //   const bar = bars.value.find((b) => b.start === fromBarStart + shiftedBy)!;
    //   const notesToMove = bar.stacks.flatMap((stack) =>
    //     stack.notes.map((note, i) => ({
    //       position: stack.position,
    //       string: i,
    //     })),
    //   );
    //   props.tabStore.guitar.moveNotes(notesToMove, 0, -shiftedBy - shiftedBy);
    //   deleteBar(fromBarStart + shiftedBy);
    //   if (timeChange) {
    //     props.tabStore.timeChanges.set(to, timeChange);
    //   }
    //   return to;
    // }
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
