import type { AnnotationStore } from "~/model/stores";
import type { TablineColumn } from "../Tab.vue";
import type { Annotation } from "~/model/data";

export function createAnnotationRenderState(
  store: AnnotationStore,
  subUnit: ComputedRef<number>,
  posToCol: (pos: number) => TablineColumn,
) {
  const rows = computed(() => Math.max(store.getRows().length, 1));

  function newRow() {
    if (store.getRows().length === rows.value - 1) {
      store.createNextRow();
    }
    store.createNextRow();
  }

  const newAnnotation = reactive<{
    row: undefined | number;
    start: undefined | number;
    end: undefined | number;
  }>({ row: undefined, start: undefined, end: undefined });

  function newStart(row: number, position: number) {
    newAnnotation.row = row;
    newAnnotation.start = position;
  }

  function newDrag(position: number) {
    if (newAnnotation.start !== undefined) {
      /* if (position > newAnnotation.start) {
      newAnnotation.end = position + subUnit.value;
    } else {
      newAnnotation.end = position;
    } */
      newAnnotation.end = position;
    }
  }

  function newEnd() {
    const { row, start, end } = newAnnotation;
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
    newAnnotation.start = newAnnotation.end = undefined;
  }

  const renders = computed(() => {
    const annotationRenders: Map<
      number, // tabline index
      Array<{
        row: number;
        startColumn: number;
        endColumn: number;
        annotation: Annotation | undefined;
      }>
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

    store.getRows().forEach((rowIndex) => {
      const annotations = store.getAnnotations(rowIndex);
      const row = rows.value - rowIndex;
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

    if (newAnnotation.start !== undefined) {
      const row = rows.value - newAnnotation.row!;
      const start = newAnnotation.start;
      const end = newAnnotation.end ?? start;
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

  return reactive({
    rows,
    newAnnotation,
    renders,
    newRow,
    newStart,
    newDrag,
    newEnd,
  });
}
