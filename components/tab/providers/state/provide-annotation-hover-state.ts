import type { Annotation } from "~/model/data";
import type { InjectionKey } from "vue";

export interface AnnotationHoverState {
  hoveredRow: ComputedRef<number | undefined>;
  hoveredAnnotation: ComputedRef<
    | {
        row: number;
        annotation: Annotation;
      }
    | undefined
  >;
  setHovered: (row: number, annotation?: Annotation) => void;
  clearHovered: () => void;
  isHovered: (row: number, annotation: Annotation) => boolean;
}

export function provideAnnotationHoverState() {
  const hoveredRow = ref<number | undefined>(undefined);
  const hoveredAnnotation = ref<{
    row: number;
    annotation: Annotation;
  }>();

  function setHovered(row: number, annotation?: Annotation) {
    if (annotation) {
      hoveredAnnotation.value = { row, annotation };
    }
    hoveredRow.value = row;
  }

  function clearHovered() {
    hoveredAnnotation.value = undefined;
    hoveredRow.value = undefined;
  }

  function isHovered(row: number, annotation: Annotation) {
    return (
      hoveredAnnotation.value?.row === row &&
      hoveredAnnotation.value?.annotation === annotation
    );
  }

  const state = {
    hoveredRow: computed(() => hoveredRow.value),
    hoveredAnnotation: computed(() => hoveredAnnotation.value),
    setHovered,
    clearHovered,
    isHovered,
  };

  provide(AnnotationHoverStateInjectionKey, state);
  return state;
}

const AnnotationHoverStateInjectionKey =
  Symbol() as InjectionKey<AnnotationHoverState>;

export function injectAnnotationHoverState() {
  return inject(AnnotationHoverStateInjectionKey) as AnnotationHoverState;
}
