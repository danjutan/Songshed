import type { InjectionKey } from "vue";
import type { Bend, GuitarStore, Tie, TieStore } from "~/model/stores";
import type { CellHoverEvents, HoveredRow } from "./cell-hover-events";
import type { TieType } from "~/model/data";

// export interface NewTie extends Partial<Tie> {
//   string?: number;
// }

export type TieWithString = { string: number } & Tie;
export type BendWithString = { string: number } & Bend;
// export type NewTie =
//   | ({ to: number } & TieWithString)
//   | ({ to?: undefined } & Partial<TieWithString>);
// type NewTie = TieWithString | undefined;

export function createTieAddState(
  cellHoverState: CellHoverEvents,
  store: ComputedRef<GuitarStore | undefined>,
  subUnit: ComputedRef<number>,
) {
  // const newTie = ref<NewTie>();
  const bend = ref(false);
  const dragFrom = ref<number>();
  const dragFromString = ref<number>(0);
  const from = ref<number>(0);
  const to = ref<number>(0);
  const midiFrom = ref<Midi>();
  const midiTo = ref<Midi>();
  const tieType: TieType = { hammer: true };
  // const hitNote = ref<number | undefined>();

  const dragDirection = computed<"right" | "left" | undefined>(() => {
    if (!dragFrom.value) {
      return undefined;
    }
    const leftMost = Math.min(from.value, to.value);
    if (leftMost < dragFrom.value!) {
      return "left";
    }
    return "right";
  });

  cellHoverState.addHoverListener((row, position) => drag(row, position));
  cellHoverState.addMouseUpListener(end);

  function start(string: number, position: number, midi: Midi) {
    dragFrom.value = position;
    dragFromString.value = string;
    to.value = position;
    from.value = position;
    midiFrom.value = midi;
  }

  function drag(row: HoveredRow, position: number) {
    if (dragFrom.value === undefined) return;
    bend.value =
      (typeof row !== "number" || row < dragFromString.value) &&
      position >= dragFrom.value;
    if (position === dragFrom.value) {
      from.value = position;
      to.value = position;
      return;
    }
    if (position < dragFrom.value) {
      for (
        let i = dragFrom.value - subUnit.value;
        i > position;
        i -= subUnit.value
      ) {
        const stack = store.value?.stacks.get(i);
        if (stack?.get(dragFromString.value)) {
          position = i;
          break;
        }
      }
      from.value = position;
      to.value = dragFrom.value; // for when you've left the screen
      const stack = store.value?.stacks.get(position);
      const note = stack?.get(dragFromString.value);
      if (note) midiFrom.value = note.midi;
    } else {
      for (
        let i = dragFrom.value + subUnit.value;
        i < position;
        i += subUnit.value
      ) {
        const stack = store.value?.stacks.get(i);
        if (stack?.get(dragFromString.value)) {
          position = i;
          break;
        }
      }

      to.value = position;
      from.value = dragFrom.value;
      const stack = store.value?.stacks.get(position);
      const note = stack?.get(dragFromString.value);
      if (note) midiTo.value = note.midi;
    }
  }

  function end() {
    if (!store.value || dragFrom.value === undefined) return;
    if (bend.value) {
      store.value.ties.setTie(dragFromString.value, dragFrom.value, {
        type: "bend",
        to: to.value,
        releaseType: "connect",
        bend: 1,
      });
    } else if (to.value !== from.value) {
      store.value.ties.setTie(dragFromString.value, from.value, {
        type: tieType,
        to: to.value,
      });
    }
    dragFrom.value = undefined;
  }

  function hasLeft(string: number, position: number) {
    const stringTies = store.value?.ties.getTies().get(string);
    if (!stringTies) return false;
    return stringTies.some((tie) => tie.to === position);
  }

  function hasRight(string: number, position: number) {
    const stringTies = store.value?.ties.getTies().get(string);
    if (!stringTies) return false;
    return stringTies.some((tie) => tie.from === position);
  }

  return reactive({
    get dragging() {
      return dragFrom.value !== undefined;
    },
    get dragDirection() {
      return dragDirection.value;
    },
    get newTie(): TieWithString | undefined {
      if (dragFrom.value !== undefined && !bend.value) {
        return {
          string: dragFromString.value,
          from: from.value,
          to: to.value,
          type: tieType,
          midiFrom: midiFrom.value,
          midiTo: midiTo.value,
        };
      }
    },
    get newBend(): BendWithString | undefined {
      if (dragFrom.value !== undefined && bend.value) {
        return {
          string: dragFromString.value,
          from: from.value,
          to: to.value,
          type: "bend",
          releaseType: "connect",
          bend: 1,
        };
      }
    },
    start,
    drag,
    end,
    hasLeft,
    hasRight,
  });
}

export type TieAddState = ReturnType<typeof createTieAddState>;

export const TieAddInjectionKey = Symbol() as InjectionKey<TieAddState>;
