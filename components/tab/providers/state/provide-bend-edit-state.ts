import type { Bend, NotePosition, TieStore } from "~/model/stores";
import type {
  CellHoverEvents,
  HoveredRow,
} from "../events/provide-cell-hover-events";
import type { TieAddState } from "./provide-tie-add-state";

export type StartType = "upswing" | "release";

export function provideBendEditState(
  props: ReactiveComputed<{
    cellHoverEvents: CellHoverEvents;
    tieAddState: TieAddState;
    // TODO: see if we can remove this dependency
    tieStore: TieStore | undefined;
  }>,
) {
  const dragging = ref<StartType | undefined>();
  const draggingBend = ref<Bend | undefined>();

  const { cellHoverEvents, tieAddState } = props;

  function start(startType: StartType, editing: Bend) {
    dragging.value = startType;
    draggingBend.value = editing;
  }

  function updateOnDrag(type: HoveredRow, position: number) {
    const bend = { ...draggingBend.value! };
    if (dragging.value === "upswing" && position >= bend.from) {
      if (bend.through) {
        if (position >= bend.to) {
          bend.through = undefined;
          bend.to = position;
          return bend;
        }
        bend.through = [position - bend.from];
        return bend;
      }
      bend.to = position;
      return bend;
    }
    if (dragging.value === "release") {
      if (bend.through && position <= bend.from + bend.through[0]) {
        bend.to = bend.from + bend.through[0];
        bend.through = undefined;
        return bend;
      }
      if (!bend.through) {
        bend.through = [bend.to - bend.from];
      }
      bend.to = position;
      bend.releaseType = typeof type === "number" ? "connect" : "hold";
      draggingBend.value = bend;
      return bend;
    }
    return bend;
  }

  function dragBendBar(position: number) {
    if (dragging.value && !tieAddState.dragging) {
      const updated = updateOnDrag("bend", position);
      props.tieStore!.updateBend(updated);
    }
  }

  function dragNoteInput(notePosition: NotePosition) {
    if (dragging.value && !tieAddState.dragging) {
      const updated = updateOnDrag(notePosition.string, notePosition.position);
      props.tieStore!.updateBend(updated);
    }
  }

  function end() {
    dragging.value = undefined;
  }

  function onLabelHover() {
    if (dragging.value === "release") {
      const bend = { ...draggingBend.value! };
      bend.to = bend.through![0] + bend.from;
      bend.through = undefined;
      props.tieStore!.updateBend(bend);
    }
  }

  function onReleaseGrabberClick(bend: Bend, grabberPosition: number) {
    if (!bend.through?.length) {
      props.tieStore!.updateBend({
        ...bend,
        through: [bend.to - bend.from],
        to: grabberPosition,
        releaseType: "hold",
      });
    }
  }

  function deleteBend(bend: Bend) {
    props.tieStore!.deleteTie(bend.string, bend.from);
  }

  function setBendValue(bend: Bend, value: number) {
    props.tieStore!.updateBend({ ...bend, bend: value });
  }

  const bendEditState = {
    start,
    dragBendBar,
    dragNoteInput,
    end,
    onLabelHover,
    deleteBend,
    setBendValue,
    onReleaseGrabberClick,
    dragging: computed(() => dragging.value !== undefined),
    draggingBend: computed(() => draggingBend.value),
  };

  provide(BendEditInjectionKey, bendEditState);

  return bendEditState;
}

export function injectBendEditState() {
  return inject(BendEditInjectionKey) as BendEditState;
}

export type BendEditState = ReturnType<typeof provideBendEditState>;

export const BendEditInjectionKey = Symbol() as InjectionKey<BendEditState>;
