import type { AnnotationStore } from "~/model/stores";
import type { CellHoverEvents } from "../../events/provide-cell-hover-events";
import type { InjectionKey } from "vue";

export interface NewAnnotation {
  rowIndex?: number;
  startPos?: number;
  endPos?: number;
}

export interface AnnotationAddState {
  newAnnotation: NewAnnotation;
  start: (row: number, position: number) => void;
  drag: (position: number) => void;
  end: () => void;
}

export function provideAnnotationAddState(
  props: ReactiveComputed<{
    store: AnnotationStore;
    subUnit: number;
    cellHoverEvents: CellHoverEvents;
  }>,
): AnnotationAddState {
  const newAnnotation = reactive<NewAnnotation>({
    rowIndex: undefined,
    startPos: undefined,
    endPos: undefined,
  });

  props.cellHoverEvents.addHoverListener((row, position) => drag(position));
  props.cellHoverEvents.addMouseUpListener(end);

  function start(rowIndex: number, startPosition: number) {
    newAnnotation.rowIndex = rowIndex;
    newAnnotation.startPos = startPosition;
  }

  function drag(position: number) {
    if (newAnnotation.startPos !== undefined) {
      newAnnotation.endPos = position;
    }
  }

  function end() {
    const { rowIndex: row, startPos: start, endPos: end } = newAnnotation;
    if (
      row !== undefined &&
      start !== undefined &&
      end !== undefined &&
      start !== end
    ) {
      const first = Math.min(start, end);
      const last = Math.max(start, end);
      props.store.createAnnotation(row, {
        start: first,
        end: last + props.subUnit,
        title: "",
      });
    }
    newAnnotation.startPos = newAnnotation.endPos = undefined;
  }

  const state = reactive({
    newAnnotation,
    start,
    drag,
    end,
  });
  provide(AnnotationAddStateInjectionKey, state);
  return state;
}

const AnnotationAddStateInjectionKey =
  Symbol() as InjectionKey<AnnotationAddState>;

export function injectAnnotationAddState() {
  return inject(AnnotationAddStateInjectionKey) as AnnotationAddState;
}
