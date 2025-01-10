import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isNoteInputDragData, isNoteInputDropData } from "./types";
import type { BendEditState } from "../providers/state/provide-bend-edit-state";

export function useBendEditMonitor(bendEditState: BendEditState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return (
            isNoteInputDragData(source.data) &&
            source.data.dragType === "bend-edit"
          );
        },
        onDragStart(args) {
          const data = args.source.data;
          if (
            isNoteInputDragData(data) &&
            data.data &&
            data.data.note !== "muted"
          ) {
            bendEditState.start("upswing", {
              string: data.string,
              from: data.position,
              to: data.position,
              bend: 1,
            });
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isNoteInputDropData(dropData)) {
              bendEditState.onLabelHover();
            }
          }
        },
        onDrop() {
          bendEditState.dragging = false;
        },
      }),
    );
  });
}
