import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isAnnotationDragData, isAnnotationResizeDragData } from "./types";
import type { AnnotationResizeState } from "../../providers/state/provide-annotation-resize-state";

export function useAnnotationResizeMonitor(resizeState: AnnotationResizeState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isAnnotationResizeDragData(source.data);
        },
        onDragStart(args) {
          console.log("drag start", args);
          const sourceData = args.source.data;
          if (isAnnotationResizeDragData(sourceData)) {
            const { row, side, annotation } = sourceData;
            const fixedSide = side === "start" ? "end" : "start";
            const position = annotation[fixedSide];
            resizeState.dragStart(row, fixedSide, position);
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const sourceData = args.source.data;
            const dropData = args.location.current.dropTargets[0].data;
            if (
              isAnnotationResizeDragData(sourceData) &&
              isAnnotationDragData(dropData)
            ) {
              sourceData.annotation[sourceData.side] = dropData.position;
            }
          }
        },
        onDrop(args) {
          resizeState.dragEnd();
        },
      }),
    );
  });
}
