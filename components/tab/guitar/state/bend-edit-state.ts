import type { Bend, TieStore } from "~/model/stores";
import type {
  CellHoverEvents,
  HoveredRow,
} from "../../state/cell-hover-events";
import type { TieAddState } from "./tie-add-state";

type StartType = "upswing" | "release";
export function createBendEditState(
  cellHoverEvents: CellHoverEvents,
  tieAddState: TieAddState,
  tieStore: ComputedRef<TieStore | undefined>,
) {
  const dragging = ref<StartType | undefined>();
  const draggingBend = ref<Bend | undefined>();

  function start(startType: StartType, editing: Bend) {
    dragging.value = startType;
    draggingBend.value = editing;
  }

  function updateOnDrag(type: HoveredRow, position: number) {
    const bend = { ...draggingBend.value! };
    if (dragging.value === "upswing" && position >= bend.from) {
      if (bend.through) {
        bend.through = [position - bend.from];
        return bend;
      }
      bend.to = position;
      return bend;
    }
    if (
      dragging.value === "release" &&
      position > bend.from + (bend.through?.[0] || 0)
    ) {
      if (!bend.through) {
        bend.through = [bend.to - bend.from];
      }
      bend.to = position;
      bend.releaseType = typeof type === "number" ? "connect" : "hold";
      return bend;
    }
    return bend;
  }

  cellHoverEvents.addHoverListener((type, position) => {
    if (dragging.value && !tieAddState.dragging) {
      const updated = updateOnDrag(type, position);
      tieStore.value!.updateBend(updated);
      // emit("updateBend", updated);
    }
  });

  cellHoverEvents.addMouseUpListener(() => {
    dragging.value = undefined;
  });

  function onLabelHover() {
    if (dragging.value === "release") {
      const bend = { ...draggingBend.value! };
      bend.to = bend.through![0] + bend.from;
      bend.through = undefined;
      tieStore.value!.updateBend(bend);
    }
  }

  function deleteBend(bend: Bend) {
    tieStore.value!.deleteTie(bend.string, bend.from);
  }

  function updateBendBy(bend: Bend, value: number) {
    tieStore.value!.updateBend({ ...bend, bend: value });
  }

  return {
    start,
    onLabelHover,
    deleteBend,
    updateBendBy,
    get dragging() {
      return dragging.value !== undefined;
    },
  };
}

export type BendEditState = ReturnType<typeof createBendEditState>;

export const BendEditInjectionKey = Symbol() as InjectionKey<BendEditState>;
