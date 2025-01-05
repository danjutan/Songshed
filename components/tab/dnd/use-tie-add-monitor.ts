import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isNoteInputDragData, isNoteInputDropData } from "./types";
import type { TieAddState } from "../providers/state/provide-tie-add-state";

export function useTieAddMonitor(tieAddState: TieAddState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return (
            isNoteInputDragData(source.data) &&
            source.data.dragType === "tie-add"
          );
        },
        onDragStart(args) {
          const data = args.source.data;
          if (
            isNoteInputDragData(data) &&
            data.data &&
            data.data.note !== "muted"
          ) {
            tieAddState.start(data.string, data.position, data.data.note);
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isNoteInputDropData(dropData)) {
              tieAddState.drag(dropData.string, dropData.position);
            }
          }
        },
      }),
    );
  });
}
