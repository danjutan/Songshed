<script lang="ts" setup>
import type { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/types";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";

const draggerRef = useTemplateRef("dragger");

const emit = defineEmits<{
  startDrag: [];
  resize: [diffX: number];
  endDrag: [];
}>();

onMounted(() => {
  watchEffect((cleanup) =>
    cleanup(
      draggable({
        element: draggerRef.value!,
        onGenerateDragPreview({ nativeSetDragImage }) {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        onDragStart() {
          emit("startDrag");
        },
        onDrag({ location }) {
          const diffX =
            location.current.input.clientX - location.initial.input.clientX;
          emit("resize", diffX);
        },
        onDrop() {
          preventUnhandled.stop();
          emit("endDrag");
        },
      }),
    ),
  );
});
</script>

<template>
  <div ref="dragger" class="divider" />
</template>

<style scoped>
.divider {
  /* width: 20px; */
  width: 4px;
  background: black;
  padding: 0;
  cursor: ew-resize;
  flex: 0 0 auto;
}
/* .divider::before {
  content: "";
  display: block;
  width: 4px;
  height: 100%;
  background: red;
  margin: 0 auto;
} */
</style>
