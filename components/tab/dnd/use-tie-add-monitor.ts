import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  isNoteInputDragData,
  isNoteInputDropData,
  isTieAddDragData,
} from "./types";
import type { TieAddState } from "../providers/state/provide-tie-add-state";

export function useTieAddMonitor(tieAddState: TieAddState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isTieAddDragData(source.data);
        },
        onDragStart(args) {
          const data = args.source.data;
          if (isTieAddDragData(data) && data.data.note !== "muted") {
            tieAddState.start(data.string, data.position, data.mode);
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isNoteInputDropData(dropData)) {
              tieAddState.drag(dropData.position);
            }
          }
        },
        onDrop(args) {
          tieAddState.end();
        },
      }),
    );
  });
}
