import type { Annotation } from "~/model/data";
import type { AnnotationAddState } from "./provide-annotation-add-state";

export interface AnnotationResizeState {
  isDragging: (row: number, annotation: Annotation) => boolean;
  dragStart: (row: number, fixed: "start" | "end", position: number) => void;
  dragEnd: () => void;
}

export function provideAnnotationResizeState(): AnnotationResizeState {
  const draggingFrom = ref<{
    fixed: "start" | "end";
    position: number;
    row: number;
  }>();

  function isDragging(row: number, annotation: Annotation) {
    if (!draggingFrom.value) return false;
    const { fixed, position, row: startRow } = draggingFrom.value;
    return row === startRow && annotation[fixed] === position;
  }

  function dragStart(row: number, fixed: "start" | "end", position: number) {
    draggingFrom.value = { fixed, position, row };
  }

  function dragEnd() {
    draggingFrom.value = undefined;
  }

  const state = { isDragging, dragStart, dragEnd };
  provide(AnnotationResizeStateInjectionKey, state);
  return state;
}

const AnnotationResizeStateInjectionKey =
  Symbol() as InjectionKey<AnnotationResizeState>;

export function injectAnnotationResizeState() {
  return inject(AnnotationResizeStateInjectionKey) as AnnotationResizeState;
}
