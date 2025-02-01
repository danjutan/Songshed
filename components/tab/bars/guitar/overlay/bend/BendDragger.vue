<script lang="ts" setup>
import type { StartType } from "~/components/tab/providers/state/provide-bend-edit-state";
import type { Bend } from "~/model/stores";
import { injectOverlayControlsTeleport } from "../../provide-overlay-controls-teleport";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getBendEditDragData } from "~/components/tab/hooks/dnd/types";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";

const props = defineProps<{
  bend: Bend;
  mode: StartType;
  x: number;
  y: number;
  width: number;
  height: number;
}>();

const emit = defineEmits<{
  mouseover: [];
  mouseleave: [];
  click: [];
}>();

const { overlayControlsSelector } = injectOverlayControlsTeleport();

const dragger = useTemplateRef("dragger");

const dragging = ref(false);
onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      draggable({
        element: dragger.value!,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        onDragStart: () => {
          dragging.value = true;
        },
        onDrop: () => {
          dragging.value = false;
        },
        getInitialData: () => {
          return getBendEditDragData({
            bend: props.bend,
            mode: props.mode,
          });
        },
      }),
    );
  });
});
</script>

<template>
  <Teleport :to="overlayControlsSelector">
    <foreignObject :x="x" :y="y" :width="width" :height="height">
      <div
        ref="dragger"
        class="bend-dragger"
        :class="{ dragging }"
        @mouseover="emit('mouseover')"
        @mouseleave="emit('mouseleave')"
        @click="emit('click')"
      />
    </foreignObject>
  </Teleport>
</template>

<style scoped>
.bend-dragger {
  pointer-events: all;
  /* background-color: red;
  opacity: 0.5; */
  width: 100%;
  height: 100%;

  &.dragging {
    pointer-events: none;
  }
}
</style>
