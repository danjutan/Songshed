import type { InjectionKey } from "vue";
import type { Bend, GuitarStore, NotePosition, Tie } from "~/model/stores";
import type { CellHoverEvents } from "../events/provide-cell-hover-events";
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

  const validPositions = computed(() => {
    const string = dragString.value;
    const from = rawFrom.value;
    let to = rawTo.value;

    // For bends, only allow dragging to the right
    if (mode.value === "bend" && to < from) {
      to = from;
    }

    // "Collisions"
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
    const [start, end] = [from, to].sort((a, b) => a - b);
    const string = dragString.value;

    if (mode.value === "bend") {
      props.store.ties.setTie(string, start, {
        type: "bend",
        to: end,
        releaseType: "connect",
        bend: 1,
      });
    } else if (to !== from) {
      props.store.ties.setTie(string, start, {
        type: defaultTieType,
        to: end,
      });
    }

    mode.value = undefined;
  }

  function hasBend(notePosition: NotePosition): boolean {
    return props.store.ties.getStartsAt(notePosition)?.type === "bend";
  }

  function hasTieBothSides(notePosition: NotePosition): boolean {
    const tieOut = props.store.ties.getStartsAt(notePosition);
    if (!tieOut || tieOut.type === "bend") return false;
    const tieIn = props.store.ties
      .getTies()
      .find(
        (tie) =>
          tie.string === notePosition.string &&
          tie.to === notePosition.position,
      );
    return !!tieIn;
  }

  // function hasTieOrBend(
  //   notePosition: NotePosition,
  // ): "tie" | "bend" | undefined {
  //   const data = props.store.ties.getStartsAt(notePosition);
  //   if (!data) return undefined;
  //   return data.type === "bend" ? "bend" : "tie";
  // }

  function hasBendsWithin(start: number, end: number): boolean {
    const within = (pos: number) => pos >= start && pos <= end;
    const adding =
      mode.value === "bend" &&
      (within(validPositions.value.from) || within(validPositions.value.to));
    return (
      adding ||
      props.store.ties
        .getBends()
        .some((bend) => within(bend.from) || within(bend.to))
    );
  }

  const tieAddState = {
    dragging: computed(() => mode.value !== undefined),
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
    start,
    drag,
    end,
    hasBend,
    hasTieBothSides,
    hasBendsWithin,
  };

  provide(TieAddInjectionKey, tieAddState);
  return tieAddState;
}

export type TieAddState = ReturnType<typeof provideTieAddState>;

const TieAddInjectionKey = Symbol() as InjectionKey<TieAddState>;

export function injectTieAddState() {
  return inject(TieAddInjectionKey) as TieAddState;
}
