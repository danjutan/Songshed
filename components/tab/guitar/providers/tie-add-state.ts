import type { InjectionKey } from "vue";
import type { Tie, TieStore } from "~/model/stores";

// export interface NewTie extends Partial<Tie> {
//   string?: number;
// }

type TieWithString = { string: number } & Tie;
export type NewTie =
  | ({ to: number } & TieWithString)
  | ({ to?: undefined } & Partial<TieWithString>);

export function createTieAddState(store: ComputedRef<TieStore | undefined>) {
  const newTie = reactive<NewTie>({ type: "hammer" });
  const dragging = ref(false);

  function start(string: number, position: number, midi: Midi) {
    dragging.value = true;
    newTie.string = string;
    newTie.from = position;
    newTie.midiFrom = midi;
  }

  function drag(position: number, midi?: Midi) {
    if (dragging.value) {
      newTie.to = position;
      newTie.midiTo = midi;
    }
  }

  function end() {
    if (!store.value) return;
    // const { string, startPos: start, endPos: end } = newTie;
    if (newTie.to !== undefined) {
      // const [from, to] = [start, end].sort((a, b) => a - b);
      store.value.setTie(newTie.string, newTie.from, {
        type: newTie.type,
        to: newTie.to,
      });
    }
    newTie.from = newTie.to = undefined;
    dragging.value = false;
  }

  return reactive({
    get dragging() {
      return dragging.value;
    },
    newTie,
    start,
    drag,
    end,
  });
}

export type TieAddState = ReturnType<typeof createTieAddState>;

export const TieAddInjectionKey = Symbol() as InjectionKey<TieAddState>;
