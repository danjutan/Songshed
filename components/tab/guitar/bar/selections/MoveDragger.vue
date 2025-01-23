<script lang="ts" setup>
import { Grip } from "lucide-vue-next";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { getNoteInputDragData } from "../../../hooks/dnd/types";
import {
  injectSelectionState,
  type RegionBounds,
} from "../../../providers/state/provide-selection-state";
import { injectCellHoverEvents } from "../../../providers/events/provide-cell-hover-events";
import type { NotePosition } from "~/model/stores";
import { injectSubUnit } from "~/components/tab/providers/provide-subunit";

const draggableRef = useTemplateRef("dragger");
const selectionState = injectSelectionState();
const subUnit = injectSubUnit();
const props = defineProps<{
  region: RegionBounds;
}>();

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      draggable({
        element: draggableRef.value!,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        getInitialData: (args) => {
          const midPosition =
            Math.round(
              (props.region.minPosition + props.region.maxPosition) /
                2 /
                subUnit.value,
            ) * subUnit.value;

          const anchor: NotePosition = {
            string: props.region.minString,
            position: midPosition,
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

function onMouseEnter() {
  selectionState.setAction("might-move");
}

function onMouseLeave() {
  if (selectionState.action === "might-move") {
    selectionState.setAction("none");
  }
}
</script>

<template>
  <div ref="dragger" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
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
