import type { InjectionKey } from "vue";
import type { GuitarStore, Tie, TieStore } from "~/model/stores";
import type { CellHoverEvents } from "./cell-hover-events";

// export interface NewTie extends Partial<Tie> {
//   string?: number;
// }

type TieWithString = { string: number } & Tie;
export type NewTie =
  | ({ to: number } & TieWithString)
  | ({ to?: undefined } & Partial<TieWithString>);

export function createTieAddState(
  cellHoverState: CellHoverEvents,
  store: ComputedRef<GuitarStore | undefined>,
  subUnit: ComputedRef<number>,
) {
  const newTie = reactive<NewTie>({ type: "hammer" });
  const dragFrom = ref<number | undefined>();
  // const hitNote = ref<number | undefined>();

  const dragDirection = computed<"right" | "left" | undefined>(() => {
    if (!newTie.to || newTie.from === newTie.to) {
      return undefined;
    }
    const leftMost = Math.min(newTie.to, newTie.from);
    if (leftMost < dragFrom.value!) {
      return "left";
    }
    return "right";
  });

  cellHoverState.addHoverListener((string, position) => drag(position));
  cellHoverState.addMouseUpListener(end);

  function start(string: number, position: number, midi: Midi) {
    dragFrom.value = position;
    newTie.string = string;
    newTie.from = position;
    newTie.to = position;
    newTie.midiFrom = midi;
  }

  function drag(position: number) {
    if (dragFrom.value !== undefined && newTie.to !== undefined) {
      if (position === dragFrom.value) {
        newTie.from = newTie.to = position;
      } else if (position < dragFrom.value) {
        for (
          let i = dragFrom.value - subUnit.value;
          i > position;
          i -= subUnit.value
        ) {
          const stack = store.value?.stacks.get(i);
          if (stack?.get(newTie.string)) {
            position = i;
            break;
          }
        }
        newTie.from = position;
        newTie.to = dragFrom.value; // for when you've left the screen
        const stack = store.value?.stacks.get(position);
        const note = stack?.get(newTie.string);
        if (note) newTie.midiFrom = note.midi;
      } else {
        for (
          let i = dragFrom.value + subUnit.value;
          i < position;
          i += subUnit.value
        ) {
          const stack = store.value?.stacks.get(i);
          if (stack?.get(newTie.string)) {
            position = i;
            break;
          }
        }

        newTie.to = position;
        newTie.from = dragFrom.value;
        const stack = store.value?.stacks.get(position);
        const note = stack?.get(newTie.string);
        if (note) newTie.midiTo = note.midi;
      }
    }
  }

  function end() {
    if (!store.value) return;
    if (newTie.to !== undefined && newTie.to !== newTie.from) {
      store.value.ties.setTie(newTie.string, newTie.from, {
        type: newTie.type,
        to: newTie.to,
      });
    }
    newTie.from = newTie.to = undefined;
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
    newTie,
    start,
    drag,
    end,
    hasLeft,
    hasRight,
  });
}

export type TieAddState = ReturnType<typeof createTieAddState>;

export const TieAddInjectionKey = Symbol() as InjectionKey<TieAddState>;
