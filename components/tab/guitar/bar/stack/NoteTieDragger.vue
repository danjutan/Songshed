<script lang="ts" setup>
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  getNoteInputDragData,
  getTieAddDragData,
  type NoteInputDragDataProps,
  type TieAddDragDataProps,
} from "~/components/tab/hooks/dnd/types";

const props = defineProps<{
  mode: "tie" | "bend";
  dragProps: Omit<TieAddDragDataProps, "type">;
}>();

const draggerRef = ref<HTMLElement>();

onMounted(() => {
  return draggable({
    element: draggerRef.value!,
    onGenerateDragPreview: ({ nativeSetDragImage }) => {
      disableNativeDragPreview({ nativeSetDragImage });
      preventUnhandled.start();
    },
    getInitialData: () => {
      return getTieAddDragData({
        ...props.dragProps,
        mode: props.mode,
      });
    },
  });
});
</script>

<template>
  <div
    ref="draggerRef"
    class="tie-dragger"
    :class="{ tie: props.mode === 'tie', bend: props.mode === 'bend' }"
  />
</template>

<style scoped>
.tie-dragger {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--tie-dragger-color);
  cursor: crosshair;
  justify-self: center;
  align-self: end;

  &.tie {
    grid-row: 2 / 3;
    grid-column: 2;
    justify-self: center;
    align-self: end;
    transform: translateY(calc(var(--context-menu-height) / 4));
  }

  &.bend {
    grid-row: 2;
    grid-column: 3;
    justify-self: end;
    align-self: center;
  }
}

.tie-dragger:active {
  cursor: grabbing;
}
</style>
