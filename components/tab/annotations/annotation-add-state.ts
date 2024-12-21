import type { AnnotationStore } from "~/model/stores";

export interface NewAnnotation {
  row: undefined | number;
  startPos: undefined | number;
  endPos: undefined | number;
}

export function createAnnotationAddState(
  store: AnnotationStore,
  subUnit: ComputedRef<number>,
) {
  const newAnnotation = reactive<NewAnnotation>({
    row: undefined,
    startPos: undefined,
    endPos: undefined,
  });

  function addStart(row: number, position: number) {
    newAnnotation.row = row;
    newAnnotation.startPos = position;
  }

  function addDrag(position: number) {
    if (newAnnotation.startPos !== undefined) {
      /* if (position > newAnnotation.start) {
      newAnnotation.end = position + subUnit.value;
    } else {
      newAnnotation.end = position;
    } */
      newAnnotation.endPos = position;
    }
  }

  function addEnd() {
    const { row, startPos: start, endPos: end } = newAnnotation;
    if (
      row !== undefined &&
      start !== undefined &&
      end !== undefined &&
      start !== end
    ) {
      const first = Math.min(start, end);
      const last = Math.max(start, end);
      store.createAnnotation(row, {
        start: first,
        end: last + subUnit.value,
        title: "",
      });
    }
    newAnnotation.startPos = newAnnotation.endPos = undefined;
  }

  return reactive({
    newAnnotation,
    addStart,
    addDrag,
    addEnd,
  });
}
