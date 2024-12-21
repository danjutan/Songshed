import type { AnnotationStore } from "~/model/stores";
import type { TablineColumn } from "../Tab.vue";
import type { NewAnnotation } from "./annotation-add-state";
import type { OverlayPosition } from "../overlay-objects";
import type { Annotation } from "~/model/data";

export function createAnnotationRenderState(
  store: AnnotationStore,
  subUnit: ComputedRef<number>,
  posToCol: (pos: number) => TablineColumn,
  newAnnotation: NewAnnotation,
) {
  return computed(() => {
    const annotationRenders: Map<
      number, // tabline index
      Array<
        OverlayPosition & {
          annotation: Annotation | undefined;
        }
      >
    > = new Map();

    function push(
      tablineIndex: number,
      row: number,
      startColumn: number,
      endColumn: number,
      annotation?: Annotation,
    ) {
      const atTabline = annotationRenders.get(tablineIndex) || [];
      atTabline.push({ row, startColumn, endColumn, annotation });
      annotationRenders.set(tablineIndex, atTabline);
    }

    const annotationRows = Math.max(store.getRows().length, 1);
    store.getRows().forEach((rowIndex) => {
      const annotations = store.getAnnotations(rowIndex);
      const row = annotationRows - rowIndex;
      for (const annotation of annotations) {
        const start = posToCol(annotation.start);
        const end = posToCol(annotation.end);
        if (start.tabline !== end.tabline) {
          push(start.tabline, row, start.column, -2, annotation);
          push(end.tabline, row, 1, end.column, annotation);
          continue;
        }
        push(start.tabline, row, start.column, end.column, annotation);
      }
    });

    if (newAnnotation.startPos !== undefined) {
      const row = annotationRows - newAnnotation.row!;
      const start = newAnnotation.startPos;
      const end = newAnnotation.endPos ?? start;
      const first = posToCol(Math.min(start, end));
      const last = posToCol(Math.max(start, end) + subUnit.value);
      if (first.tabline !== last.tabline) {
        push(first.tabline, row, first.column, -2);
        push(last.tabline, row, 1, last.column);
      } else {
        push(first.tabline, row, first.column, last.column);
      }
    }

    return annotationRenders;
  });
}
