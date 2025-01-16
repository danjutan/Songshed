import type { InjectionKey } from "vue";
import type { Bend, GuitarStore, Tie, TieStore } from "~/model/stores";
import type {
  CellHoverEvents,
  HoveredRow,
} from "../events/provide-cell-hover-events";
import { TieType } from "~/model/data";

export function provideTieAddState(
  props: ReactiveComputed<{
    cellHoverEvents: CellHoverEvents;
    store: GuitarStore;
    subUnit: number;
  }>,
) {
  const mode = ref<"tie" | "bend" | undefined>();
  const dragString = ref<number>(0);
  const rawFrom = ref<number>(0);
  const rawTo = ref<number>(0);
  const defaultTieType = TieType.Hammer;

  // Compute the valid positions based on raw drag coordinates
  const validPositions = computed(() => {
    const string = dragString.value;
    const from = rawFrom.value;
    let to = rawTo.value;

    // For bends, only allow dragging to the right
    if (mode.value === "bend" && to < from) {
      to = from;
    }

    // Find valid note positions
    if (to !== from) {
      const direction = to < from ? -1 : 1;
      const start = from + direction * props.subUnit;
      const end = to;

      for (
        let i = start;
        direction > 0 ? i <= end : i >= end;
        i += direction * props.subUnit
      ) {
        const stack = props.store.stacks.get(i);
        if (stack?.get(string)) {
          to = i;
          break;
        }
      }
    }

    return { from, to };
  });

  const midiValues = computed(() => {
    const { from, to } = validPositions.value;
    const string = dragString.value;

    const fromStack = props.store.stacks.get(from);
    const toStack = props.store.stacks.get(to);

    const fromNote = fromStack?.get(string);
    const toNote = toStack?.get(string);

    return {
      from: fromNote?.note !== "muted" ? fromNote?.note : undefined,
      to: toNote?.note !== "muted" ? toNote?.note : undefined,
    };
  });

  const dragDirection = computed<"right" | "left" | undefined>(() => {
    if (!mode.value) return undefined;
    const { from, to } = validPositions.value;
    return from > to ? "left" : "right";
  });

  function start(string: number, position: number, type: "tie" | "bend") {
    mode.value = type;
    dragString.value = string;
    rawFrom.value = position;
    rawTo.value = position;
  }

  function drag(position: number) {
    if (!mode.value) return;
    rawTo.value = position;
  }

  function end() {
    if (!props.store || !mode.value) return;

    const { from, to } = validPositions.value;
    const string = dragString.value;

    if (mode.value === "bend") {
      props.store.ties.setTie(string, from, {
        type: "bend",
        to,
        releaseType: "connect",
        bend: 1,
      });
    } else if (to !== from) {
      props.store.ties.setTie(string, from, {
        type: defaultTieType,
        to,
      });
    }

    mode.value = undefined;
  }

  const tieAddState = {
    get dragging() {
      return mode.value !== undefined;
    },
    get dragDirection() {
      return dragDirection.value;
    },
    get newTie(): Tie | undefined {
      if (mode.value === "tie") {
        const { from, to } = validPositions.value;
        const { from: midiFrom, to: midiTo } = midiValues.value;
        return {
          string: dragString.value,
          from,
          to,
          type: defaultTieType,
          midiFrom,
          midiTo,
        };
      }
    },
    get newBend(): Bend | undefined {
      if (mode.value === "bend") {
        const { from, to } = validPositions.value;
        return {
          string: dragString.value,
          from,
          to,
          type: "bend",
          releaseType: "connect",
          bend: 1,
        };
      }
    },
    get hasTiesOrTieing() {
      return (
        mode.value || (props.store && props.store.ties.getTies().length > 0)
      );
    },
    start,
    drag,
    end,
  };

  provide(TieAddInjectionKey, tieAddState);
  return tieAddState;
}

export type TieAddState = ReturnType<typeof provideTieAddState>;

const TieAddInjectionKey = Symbol() as InjectionKey<TieAddState>;

export function injectTieAddState() {
  return inject(TieAddInjectionKey) as TieAddState;
}
