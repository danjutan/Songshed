import type { AnnotationStore } from "~/model/stores";
import type { InjectionKey } from "vue";

export interface NewAnnotation {
  row: number;
  start: number;
  end: number;
}

export interface AnnotationAddState {
  newAnnotation: ComputedRef<NewAnnotation | undefined>;
  dragStart: (row: number, position: number) => void;
  dragMove: (position: number) => void;
  dragEnd: () => void;
}

export function provideAnnotationAddState(
  props: ReactiveComputed<{
    store: AnnotationStore;
    getSubUnitForPosition: (position: number) => number;
  }>,
): AnnotationAddState {
  const rawAnnotation = ref<{
    row: number;
    start: number;
    end: number;
  }>();

  const newAnnotation = computed<NewAnnotation | undefined>(() => {
    if (!rawAnnotation.value) return undefined;
    const { row, start, end } = rawAnnotation.value;
    const existingOnRow = props.store.getAnnotations(row);
    if (end >= start) {
      const blockingRight = existingOnRow.find(
        (ann) => ann.start > start && ann.end < end,
      );
      return {
        row,
        start,
        end: blockingRight
          ? blockingRight.start - props.getSubUnitForPosition(start)
          : end,
      };
    }
    if (end < start) {
      const blockingLeft = existingOnRow.find(
        (ann) => ann.start < start && ann.end >= end,
      );
      return {
        row,
        start: blockingLeft
          ? blockingLeft.end + props.getSubUnitForPosition(end)
          : end,
        end: start,
      };
    }
  });

  function dragStart(row: number, startPosition: number) {
    rawAnnotation.value = {
      row,
      start: startPosition,
      end: startPosition,
    };
  }

  function dragMove(position: number) {
    if (rawAnnotation.value) {
      rawAnnotation.value.end = position;
    }
  }

  function dragEnd() {
    if (!newAnnotation.value) {
      return;
    }
    const { row, start, end } = newAnnotation.value;
    props.store.createAnnotation(row, {
      start,
      end,
      text: "...",
    });
    rawAnnotation.value = undefined;
  }

  const state = {
    newAnnotation,
    dragStart,
    dragMove,
    dragEnd,
  };
  provide(AnnotationAddStateInjectionKey, state);
  return state;
}

const AnnotationAddStateInjectionKey =
  Symbol() as InjectionKey<AnnotationAddState>;

export function injectAnnotationAddState() {
  return inject(AnnotationAddStateInjectionKey) as AnnotationAddState;
}
