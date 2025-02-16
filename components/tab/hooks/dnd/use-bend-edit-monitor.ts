import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  isBendEditDragData,
  isBendBarDropData,
  isNoteInputDropData,
} from "./types";
import type { BendEditState } from "../../providers/state/provide-bend-edit-state";

export function useBendEditMonitor(bendEditState: BendEditState) {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isBendEditDragData(source.data);
        },
        onDragStart(args) {
          const startData = args.source.data;
          if (isBendEditDragData(startData)) {
            bendEditState.start(startData.mode, startData.bend);
          }
        },
        onDropTargetChange(args) {
          if (args.location.current.dropTargets.length > 0) {
            const dropData = args.location.current.dropTargets[0].data;
            if (isBendBarDropData(dropData)) {
              bendEditState.dragBendBar(dropData.position);
              return;
            }
            if (isNoteInputDropData(dropData)) {
              bendEditState.dragNoteInput(dropData);
            }
          }
        },
        onDrop(args) {
          bendEditState.end();
        },
      }),
    );
  });
}
