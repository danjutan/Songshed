import type { AnnotationStore } from "~/model/stores";
import type { NewAnnotation } from "./annotation-add-state";
import type { Annotation } from "~/model/data";
import type { AnnotationRenderProps } from "../AnnotationRender.vue";
import { type ColumnsMap } from "../../providers/provide-columns-map";

export function createAnnotationRenderState(
  props: ReactiveComputed<{
    store: AnnotationStore;
    subUnit: number;
    newAnnotation: NewAnnotation;
    columnsMap: ColumnsMap;
  }>,
) {
  return computed(() => {
    const { store, subUnit, newAnnotation, columnsMap } = props;
    const annotationRenders: Map<
      number, // tabline index
      Array<AnnotationRenderProps>
    > = new Map();

    function push(
      tablineIndex: number,
      row: number,
      startColumn: number,
      endColumn: number,
      annotation?: Annotation,
    ) {
      const atTabline = annotationRenders.get(tablineIndex) || [];
      const columnSpan = endColumn - startColumn;
      atTabline.push({
        row,
        startColumn,
        columnSpan,
        annotation,
      });
      annotationRenders.set(tablineIndex, atTabline);
    }

    const annotationRows = Math.max(store.getRows().length, 1);
    store.getRows().forEach((rowIndex) => {
      const annotations = store.getAnnotations(rowIndex);
      const row = annotationRows - rowIndex;
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
      const row = annotationRows - newAnnotation.row!;
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

    return annotationRenders;
  });
}
