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
    store: GuitarStore | undefined;
    subUnit: number;
  }>,
) {
  // const newTie = ref<NewTie>();
  const bend = ref(false);
  const dragFrom = ref<number>();
  const dragFromString = ref<number>(0);
  const from = ref<number>(0);
  const to = ref<number>(0);
  const midiFrom = ref<Midi>();
  const midiTo = ref<Midi>();
  const defaultTieType = TieType.Hammer;
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

  props.cellHoverEvents.addHoverListener((row, position) =>
    drag(row, position),
  );
  props.cellHoverEvents.addMouseUpListener(end);

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
    // TODO: use this collision logic for editing, too (there's currently inconsistencies). also, document it. maybe we don't need a separate bend-edit-state?
    if (position < dragFrom.value) {
      for (
        let i = dragFrom.value - props.subUnit;
        i > position;
        i -= props.subUnit
      ) {
        const stack = props.store?.stacks.get(i);
        if (stack?.get(dragFromString.value)) {
          position = i;
          break;
        }
      }
      from.value = position;
      to.value = dragFrom.value; // for when you've left the screen
      const stack = props.store?.stacks.get(position);
      const noteData = stack?.get(dragFromString.value);
      if (noteData && noteData.note !== "muted") midiFrom.value = noteData.note;
    } else {
      for (
        let i = dragFrom.value + props.subUnit;
        i < position;
        i += props.subUnit
      ) {
        const stack = props.store?.stacks.get(i);
        if (stack?.get(dragFromString.value)) {
          position = i;
          break;
        }
      }

      to.value = position;
      from.value = dragFrom.value;
      const stack = props.store?.stacks.get(position);
      const noteData = stack?.get(dragFromString.value);
      if (noteData && noteData.note !== "muted") midiTo.value = noteData.note;
    }
  }

  function end() {
    if (!props.store || dragFrom.value === undefined) return;
    if (bend.value) {
      props.store.ties.setTie(dragFromString.value, dragFrom.value, {
        type: "bend",
        to: to.value,
        releaseType: "connect",
        bend: 1,
      });
    } else if (to.value !== from.value) {
      props.store.ties.setTie(dragFromString.value, from.value, {
        type: defaultTieType,
        to: to.value,
      });
    }
    dragFrom.value = undefined;
  }

  const tieAddState = {
    get dragging() {
      return dragFrom.value !== undefined;
    },
    get dragDirection() {
      return dragDirection.value;
    },
    get newTie(): Tie | undefined {
      if (dragFrom.value !== undefined && !bend.value) {
        return {
          string: dragFromString.value,
          from: from.value,
          to: to.value,
          type: defaultTieType,
          midiFrom: midiFrom.value,
          midiTo: midiTo.value,
        };
      }
    },
    get newBend(): Bend | undefined {
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
  };

  provide(TieAddInjectionKey, tieAddState);

  return tieAddState;
}

export type TieAddState = ReturnType<typeof provideTieAddState>;

const TieAddInjectionKey = Symbol() as InjectionKey<TieAddState>;

export function injectTieAddState() {
  return inject(TieAddInjectionKey) as TieAddState;
}
