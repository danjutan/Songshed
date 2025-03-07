import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isBarDragData, isInsertBarDropData } from "./types";
import type { BarManagementState } from "../../providers/state/provide-bar-management";
import type { BarHoverState } from "../../providers/state/provide-bar-hover-state";

export function useBarDragMonitor(barManagement: BarManagementState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isBarDragData(source.data);
        },
        onDragStart(args) {
          const sourceData = args.source.data;
          if (isBarDragData(sourceData)) {
            console.log("bar drag start");
          }
        },
        onDropTargetChange(args) {
          // if (args.location.current.dropTargets.length > 0) {
          // }
        },
        onDrop(args) {
          const insertBarData = args.location.current.dropTargets.find(
            (target) => isInsertBarDropData(target.data),
          );
          if (!insertBarData) return;
          const sourceData = args.source.data;
          console.log("drop", sourceData, args.location.current.dropTargets);
          if (
            isBarDragData(sourceData) &&
            isInsertBarDropData(insertBarData.data)
          ) {
            console.log("here");
            const dragStart = sourceData.barStart;
            if (dragStart && dragStart !== insertBarData.data.position) {
              console.log("moving", dragStart, insertBarData.data.position);
              barManagement.reorderBar(dragStart, insertBarData.data.position);
            }
          }
        },
      }),
    );
  });
}
