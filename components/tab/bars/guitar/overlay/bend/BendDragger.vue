<script lang="ts" setup>
import type { StartType } from "~/components/tab/providers/state/provide-bend-edit-state";
import type { Bend } from "~/model/stores";
import { injectOverlayControlsTeleport } from "../../provide-overlay-controls-teleport";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getBendEditDragData } from "~/components/tab/hooks/dnd/types";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  useCoordsDirective,
  type ValueFn,
} from "~/components/tab/hooks/use-coords-directive";
import { injectSpacingsState } from "~/components/tab/providers/provide-spacings";

const props = defineProps<{
  bend: Bend;
  mode: StartType;
  position: number;
  leftFn: ValueFn<"position">;
  widthFn: ValueFn<"position">;
  topPx: string;
}>();

const emit = defineEmits<{
  mouseenter: [];
  mouseleave: [];
  click: [];
}>();

const { draggersSelector } = injectOverlayControlsTeleport();
const { cellHeightPx } = injectSpacingsState();

const dragger = useTemplateRef("dragger");
const dragging = ref(false);

const vCoords = useCoordsDirective({
  position: computed(() => props.position),
});
watchEffect((cleanup) => {
  if (!dragger.value) {
    return;
  }
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
</script>

<template>
  <foreignObject>
    <Teleport :to="draggersSelector">
      <div
        ref="dragger"
        v-coords:left="leftFn"
        v-coords:width="widthFn"
        class="bend-dragger"
        :class="{ dragging }"
        @mouseenter="emit('mouseenter')"
        @mouseleave="emit('mouseleave')"
        @click="emit('click')"
      />
    </Teleport>
  </foreignObject>
</template>

<style scoped>
.bend-dragger {
  position: absolute;
  top: v-bind(topPx);
  height: v-bind(cellHeightPx);

  pointer-events: all;

  &.dragging {
    pointer-events: none;
  }

  /* background-color: red;
  opacity: 0.5; */
}
</style>
