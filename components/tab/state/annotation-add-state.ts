import type { AnnotationStore } from "~/model/stores";
import type { CellHoverEvents } from "./cell-hover-events";

export interface NewAnnotation {
  row?: number;
  startPos?: number;
  endPos?: number;
}

export interface AnnotationAddState {
  newAnnotation: NewAnnotation;
  start: (row: number, position: number) => void;
  drag: (position: number) => void;
  end: () => void;
}

export function createAnnotationAddState(
  store: AnnotationStore,
  subUnit: ComputedRef<number>,
  cellHoverState: CellHoverEvents,
): AnnotationAddState {
  const newAnnotation = reactive<NewAnnotation>({
    row: undefined,
    startPos: undefined,
    endPos: undefined,
  });

  cellHoverState.addHoverListener((row, position) => drag(position));
  cellHoverState.addMouseUpListener(end);

  function start(row: number, position: number) {
    newAnnotation.row = row;
    newAnnotation.startPos = position;
  }

  function drag(position: number) {
    if (newAnnotation.startPos !== undefined) {
      /* if (position > newAnnotation.start) {
      newAnnotation.end = position + subUnit.value;
    } else {
      newAnnotation.end = position;
    } */
      newAnnotation.endPos = position;
    }
  }

  function end() {
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
    start,
    drag,
    end,
  });
}
