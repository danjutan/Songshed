<script lang="ts" setup>
import type { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/types";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  GripVertical,
  Plus,
  Delete,
  CornerRightUp,
  CornerDownLeft,
} from "lucide-vue-next";
const draggerRef = useTemplateRef("dragger");

const props = defineProps<{
  joinable: boolean;
  barIndex: number;
}>();

const emit = defineEmits<{
  startDrag: [];
  resize: [diffX: number];
  endDrag: [];
  insert: [];
  delete: [];
  join: [];
  break: [];
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
  <div ref="dragger" class="divider">
    <div class="thicc">
      <GripVertical />
      <div class="button insert" @click="emit('insert')">
        <Plus />
      </div>
      <div class="button delete" @click="emit('delete')">
        <Delete />
      </div>
      <template v-if="barIndex === 0">
        <div v-if="joinable" class="button join" @click="emit('join')">
          <CornerRightUp />
        </div>
      </template>
      <div v-else class="button break" @click="emit('break')">
        <CornerDownLeft />
      </div>
    </div>
  </div>
</template>

<style scoped>
.divider {
  width: var(--divider-width);
  height: 100%;
  background: black;
  padding: 0;
  cursor: ew-resize;
  position: relative;
}

.thicc {
  display: grid;
  grid-template-rows: repeat(6, var(--cell-height));
  height: 100%;
  position: absolute;
  background: black;
  width: var(--note-font-size);
  transform: translateX(-25%);
  z-index: var(--divider-z-index);
}

.divider:not(:hover) .thicc {
  display: none;
}

.button {
  cursor: pointer;
  &:hover svg {
    stroke-width: 3;
  }
}

.insert {
  grid-row: -4;
  transform: translateY(-50%);
}
.delete {
  grid-row: -3;
}

.break,
.join {
  grid-row: -2;
}

svg {
  color: white;
  width: var(--context-menu-height);
}

.delete {
  transform: rotate(180deg);
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
