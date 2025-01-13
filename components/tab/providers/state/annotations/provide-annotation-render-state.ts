import type { AnnotationStore } from "~/model/stores";
import type { NewAnnotation } from "./provide-annotation-add-state";
import type { Annotation } from "~/model/data";
import type { AnnotationRenderProps } from "../../../annotations/AnnotationRender.vue";
import type { ColumnsMap } from "../../provide-columns-map";
import type { InjectionKey } from "vue";

export interface AnnotationRenderState {
  annotationRenders: Map<number, Array<AnnotationRenderProps>>;
  annotationRows: number;
}

export function provideAnnotationRenderState(
  props: ReactiveComputed<{
    store: AnnotationStore;
    subUnit: number;
    newAnnotation: NewAnnotation;
    columnsMap: ColumnsMap;
  }>,
): AnnotationRenderState {
  const annotationRenders = computed(() => {
    const { store, subUnit, newAnnotation, columnsMap } = props;
    const renders: Map<number, Array<AnnotationRenderProps>> = new Map();

    function push(
      tablineIndex: number,
      row: number,
      startColumn: number,
      endColumn: number,
      annotation?: Annotation,
    ) {
      const atTabline = renders.get(tablineIndex) || [];
      const columnSpan = endColumn - startColumn;
      atTabline.push({
        row,
        startColumn,
        columnSpan,
        annotation,
      });
      renders.set(tablineIndex, atTabline);
    }

    store.getRows().forEach((rowIndex) => {
      const annotations = store.getAnnotations(rowIndex);
      const row = rowIndex + 1;
      for (const annotation of annotations) {
        const start = columnsMap[annotation.start];
        const end = columnsMap[annotation.end];
        if (start.tabline !== end.tabline) {
          push(
            start.tabline,
            row,
            start.column,
            start.tablineColumns,
            annotation,
          );
          if (end.column > 2) {
            push(end.tabline, row, 2, end.column, annotation);
          }
          continue;
        }
        push(start.tabline, row, start.column, end.column, annotation);
      }
    });

    if (newAnnotation.startPos !== undefined) {
      const row = newAnnotation.rowIndex! + 1;
      const start = newAnnotation.startPos;
      const end = newAnnotation.endPos ?? start;
      const first = columnsMap[Math.min(start, end)];
      const last = columnsMap[Math.max(start, end)];
      if (first.tabline !== last.tabline) {
        push(first.tabline, row, first.column, first.tablineColumns);
        push(last.tabline, row, 2, last.column + 1);
      } else {
        push(first.tabline, row, first.column, last.column + 1);
      }
    }

    return renders;
  });

  const state = reactiveComputed(() => ({
    annotationRenders,
    annotationRows: computed(() => props.store.getRows().length),
  }));

  provide(AnnotationRenderStateInjectionKey, state);
  return state;
}

const AnnotationRenderStateInjectionKey =
  Symbol() as InjectionKey<AnnotationRenderState>;

export function injectAnnotationRenderState() {
  return inject(AnnotationRenderStateInjectionKey) as AnnotationRenderState;
}
