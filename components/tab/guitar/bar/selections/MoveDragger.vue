<script lang="ts" setup>
import { Grip } from "lucide-vue-next";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { getNoteInputDragData } from "../../../dnd/types";
import { injectSelectionState } from "../../../providers/state/provide-selection-state";
import { injectCellHoverEvents } from "../../../providers/events/provide-cell-hover-events";
import type { NotePosition } from "~/model/stores";

const draggableRef = useTemplateRef("dragger");
const selectionState = injectSelectionState();
const cellHoverEvents = injectCellHoverEvents();

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      draggable({
        element: draggableRef.value!,
        getInitialData: (args) => {
          const hoveredPosition = cellHoverEvents.hoveredNote.value!;
          // TODO: this is a little hacky; maybe the anchor should be (one of the) midpoints of the current selection region
          const anchor: NotePosition = selectionState.isSelected(
            hoveredPosition,
          )
            ? hoveredPosition
            : {
                position: hoveredPosition.position,
                string: hoveredPosition.string + 1,
              };

          return getNoteInputDragData({
            ...anchor,
            dragType: "move",
          });
        },
      }),
    );
  });
});
</script>

<template>
  <div
    ref="dragger"
    @mouseenter="selectionState.setAction('might-move')"
    @mouseleave="selectionState.setAction('none')"
  >
    <Grip :size="16" />
  </div>
</template>

<style scoped>
div {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}
</style>
