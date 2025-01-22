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
  deleteHoverStart: [];
  deleteHoverEnd: [];
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
  <div ref="dragger" class="divider" :class="{ first: barIndex === 0 }">
    <div class="thicc">
      <div class="grip">
        <GripVertical />
      </div>
      <div class="button insert" @click="emit('insert')">
        <Plus />
      </div>
      <div
        class="button delete"
        @click="emit('delete')"
        @mouseover="emit('deleteHoverStart')"
        @mouseleave="emit('deleteHoverEnd')"
      >
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

.divider.first {
  justify-self: end;
  & .thicc {
    transform: translateX(-50%);
  }
}

.divider:not(:hover) .thicc {
  display: none;
}

.grip {
  grid-area: 1 / 1;
}

.button {
  cursor: pointer;
  grid-column: 1;
  &:hover svg {
    stroke-width: 3;
  }
}

.insert {
  grid-row: 1 / -1;
  align-self: center;
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
