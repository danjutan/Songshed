import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { AnnotationAddState } from "../../providers/state/annotations/provide-annotation-add-state";
import { isAnnotationDragData } from "./types";

export function useAnnotationAddMonitor(
  annotationAddState: AnnotationAddState,
) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isAnnotationDragData(source.data);
        },
        /* Redundant because of `mouseDown` in AnnotationDragDroppable, which we need for single-cell annotations
        onDragStart(args) {
          const data = args.source.data;
          if (isAnnotationDragData(data)) {
            annotationAddState.dragStart(data.row, data.position);
          } 
        },*/
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isAnnotationDragData(dropData)) {
              annotationAddState.dragMove(dropData.position);
            }
          }
        },
        onDrop() {
          annotationAddState.dragEnd();
        },
      }),
    );
  });
}
