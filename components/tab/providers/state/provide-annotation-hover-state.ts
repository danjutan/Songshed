import type { Annotation } from "~/model/data";
import type { InjectionKey } from "vue";

export interface AnnotationHoverState {
  // hoveredAnnotation: Ref<
  //   | {
  //       row: number;
  //       annotation: Annotation;
  //     }
  //   | undefined
  // >;
  setHovered: (row: number, annotation: Annotation) => void;
  clearHovered: () => void;
  isHovered: (row: number, annotation: Annotation) => boolean;
  isAnyHovered: ComputedRef<boolean>;
}

export function provideAnnotationHoverState() {
  const hoveredAnnotation = ref<{
    row: number;
    annotation: Annotation;
  }>();

  function setHovered(row: number, annotation: Annotation) {
    hoveredAnnotation.value = { row, annotation };
  }

  function clearHovered() {
    hoveredAnnotation.value = undefined;
  }

  function isHovered(row: number, annotation: Annotation) {
    return (
      hoveredAnnotation.value?.row === row &&
      hoveredAnnotation.value?.annotation === annotation
    );
  }

  const state = {
    // hoveredAnnotation,
    isAnyHovered: computed(() => hoveredAnnotation.value !== undefined),
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
