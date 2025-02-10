import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isNoteInputDragData, isNoteInputDropData } from "./types";
import type { SelectionState } from "../../providers/state/provide-selection-state";

export function useSelectMonitor(selectionState: SelectionState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return (
            isNoteInputDragData(source.data) &&
            source.data.dragType === "select"
          );
        },
        onDragStart(args) {
          // See NoteContainer onMouseDown for why we don't clear the selection here
          const data = args.source.data;
          if (isNoteInputDragData(data)) {
            selectionState.startSelection(data);
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isNoteInputDropData(dropData)) {
              const startData = args.source.data;
              if (isNoteInputDragData(startData)) {
                selectionState.growSelection(dropData);
              }
            }
          }
        },
        onDrop() {
          selectionState.endSelection();
        },
      }),
    );
  });
}
