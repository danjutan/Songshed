import type { GuitarNote, NoteStack } from "~/model/data";
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
  reorderBar: (fromBarStart: number, to: number) => number;
  insertBreak: (start: number) => void;
  joinBreak: (start: number) => void;
  newBarClick: () => void;
}

const BarManagementInjectionKey = Symbol() as InjectionKey<BarManagementState>;

export function provideBarManagement(
  props: ReactiveComputed<{
    tabStore: TabStore;
    subUnit: number;
  }>,
) {
  const newBarStart = ref(0);
  const barSize = computed(
    () => props.tabStore.time.beatsPerBar * props.tabStore.time.beatSize,
  );

  const bars = computed<Bar[]>(() => {
    if (!props.tabStore.guitar) return [];
    const bars: Bar[] = [];
    for (
      let i = 0;
      i <= Math.max(newBarStart.value, props.tabStore.guitar.getLastPosition());
      i += barSize.value
    ) {
      bars.push({
        start: i,
        end: i + barSize.value,
        stacks: props.tabStore.guitar.getStacks(
          i,
          i + barSize.value,
          props.subUnit,
        ),
      });
    }
    return bars;
  });

  function deleteBar(start: number) {
    props.tabStore.guitar.deleteStacks(start, start + barSize.value);
    props.tabStore.guitar.shiftFrom(start, -barSize.value);
  }

  function insertBar(start: number) {
    props.tabStore.guitar.shiftFrom(start, barSize.value);
    return barSize.value;
  }

  function reorderBar(fromBarStart: number, to: number) {
    // const toBarStart = to > fromBarStart ? to + barSize.value : to;
    // Moving forwards
    if (to > fromBarStart) {
      const shiftedBy = insertBar(to - barSize.value);
      const nextBar = bars.value.find((b) => b.start === to + shiftedBy)!;
      const notesToMove = nextBar.stacks.flatMap((stack) =>
        stack.notes.map((note, i) => ({
          position: stack.position,
          string: i,
        })),
      );
      props.tabStore.guitar.moveNotes(notesToMove, 0, -shiftedBy - shiftedBy);
      deleteBar(to + shiftedBy);
      return to + shiftedBy;
    } else {
      const shiftedBy = insertBar(to);
      const bar = bars.value.find((b) => b.start === fromBarStart + shiftedBy)!;
      const notesToMove = bar.stacks.flatMap((stack) =>
        stack.notes.map((note, i) => ({
          position: stack.position,
          string: i,
        })),
      );
      props.tabStore.guitar.moveNotes(notesToMove, 0, -shiftedBy - shiftedBy);
      deleteBar(fromBarStart + shiftedBy);
      return to;
    }
  }

  function insertBreak(start: number) {
    props.tabStore.lineBreaks.add(start);
  }

  function joinBreak(start: number) {
    props.tabStore.lineBreaks.delete(start);
  }

  function newBarClick() {
    const lastBarStart = bars.value.at(-1)!.start;
    newBarStart.value = lastBarStart + barSize.value;
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
  }));

  provide(BarManagementInjectionKey, state);
  return state;
}

export function injectBarManagement() {
  return inject(BarManagementInjectionKey) as BarManagementState;
}
