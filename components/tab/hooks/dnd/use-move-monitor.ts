import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isNoteInputDragData, isNoteInputDropData } from "./types";
import type { SelectionState } from "../../providers/state/provide-selection-state";

export function useMoveMonitor(selectionState: SelectionState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return (
            isNoteInputDragData(source.data) && source.data.dragType === "move"
          );
        },
        onDragStart(args) {
          const startData = args.source.data;
          if (isNoteInputDragData(startData)) {
            selectionState.startMove(startData);
          }
        },
        onDropTargetChange(args) {
          // selectionState.setAction("moving");
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isNoteInputDropData(dropData)) {
              selectionState.moveOver(dropData);
              // selectionState.moveSelectionsIfValid(dropData);
            }
          }
        },
        onDrop(args) {
          // if (args.location.current.dropTargets.length > 0) {
          //   const dropData = args.location.current.dropTargets[0].data;
          //   if (isNoteInputDropData(dropData)) {
          //     // copy modifier only works on Safari :( TODO: Workaround on Chrome, which cancels the drag altogether
          //     const { metaKey, ctrlKey } = args.location.current.input;
          //     selectionState.endMove(metaKey || ctrlKey);
          //   }
          //   return;
          // }
          // TODO: what behavior do we want when the pointer goes off tab?
          // selectionState.cancelMove();
          selectionState.endMove();
        },
      }),
    );
  });
}
