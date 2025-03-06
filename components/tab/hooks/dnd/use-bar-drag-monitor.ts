import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isBarDragData, isInsertBarDropData } from "./types";
import type { BarManagementState } from "../../providers/state/provide-bar-management";
import type { BarHoverState } from "../../providers/state/provide-bar-hover-state";

export function useBarDragMonitor(barManagement: BarManagementState) {
  let dragStart: number | undefined;
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isBarDragData(source.data);
        },
        onDragStart(args) {
          const sourceData = args.source.data;
          if (isBarDragData(sourceData)) {
            dragStart = sourceData.barStart;
            console.log("bar drag start");
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isInsertBarDropData(dropData)) {
              if (dragStart && dragStart !== dropData.position) {
                console.log("moving", dragStart, dropData.position);
                dragStart = barManagement.reorderBar(
                  dragStart,
                  dropData.position,
                );
              }
            }
          }
        },
        onDrop(args) {
          // const sourceData = args.source.data;
          dragStart = undefined;
        },
      }),
    );
  });
}
