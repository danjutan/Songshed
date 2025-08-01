import type { Annotation } from "~/model/data";
import type { AnnotationAddState } from "./provide-annotation-add-state";
import type { AnnotationStore } from "~/model/stores";
import type { ComputedRef } from "vue";

type DraggingFrom = {
  fixed: "start" | "end";
  position: number;
  row: number;
};

export interface AnnotationResizeState {
  draggingFrom: ComputedRef<DraggingFrom | undefined>;
  isDragging: (row: number, annotation: Annotation) => boolean;
  dragStart: (from: DraggingFrom) => void;
  dragMove: (
    row: number,
    annotation: Annotation,
    side: "start" | "end",
    position: number,
  ) => void;
  dragEnd: () => void;
}

export function provideAnnotationResizeState(
  props: ReactiveComputed<{
    store: AnnotationStore;
    getSubUnitForPosition: (position: number) => number;
  }>,
): AnnotationResizeState {
  const draggingFrom = ref<DraggingFrom>();

  function isDragging(row: number, annotation: Annotation) {
    if (!draggingFrom.value) return false;
    const { fixed, position, row: startRow } = draggingFrom.value;
    return row === startRow && annotation[fixed] === position;
  }

  function dragStart(from: DraggingFrom) {
    draggingFrom.value = from;
  }

  function dragMove(
    row: number,
    annotation: Annotation,
    side: "start" | "end",
    position: number,
  ) {
    if (side === "start" && position > annotation.end) {
      position = annotation.start;
    }
    if (side === "end" && position < annotation.start) {
      position = annotation.end;
    }
    // Similar blocking logic to dragMove in provide-annotation-add-state
    const existingOnRow = props.store.getAnnotations(row);
    if (side === "end") {
      const blockingRight = existingOnRow.find(
        (ann) => ann.start > annotation.start && position >= ann.start,
      );
      if (blockingRight) {
        position =
          blockingRight.start - props.getSubUnitForPosition(annotation.start);
      }
    }
    if (side === "start") {
      const blockingLeft = existingOnRow.find(
        (ann) => ann.start < annotation.start && ann.end >= position,
      );
      if (blockingLeft) {
        position = blockingLeft.end + props.getSubUnitForPosition(position);
      }
    }
    annotation[side] = position;
  }

  function dragEnd() {
    draggingFrom.value = undefined;
  }

  const state = {
    isDragging,
    dragStart,
    dragMove,
    dragEnd,
    draggingFrom: computed(() => draggingFrom.value),
  };
  provide(AnnotationResizeStateInjectionKey, state);
  return state;
}

const AnnotationResizeStateInjectionKey =
  Symbol() as InjectionKey<AnnotationResizeState>;

export function injectAnnotationResizeState() {
  return inject(AnnotationResizeStateInjectionKey) as AnnotationResizeState;
}
