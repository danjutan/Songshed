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
import { injectBarManagement } from "~/components/tab/providers/state/provide-bar-management";

const draggerRef = useTemplateRef("dragger");
const { insertBar, deleteBar, insertBreak, joinBreak } = injectBarManagement();

const props = defineProps<{
  startOfLine: boolean;
  barStart: number;
  joinable: boolean;
}>();

const emit = defineEmits<{
  startDrag: [];
  resize: [diffX: number];
  endDrag: [];
  deleteHoverStart: [];
  deleteHoverEnd: [];
}>();

onMounted(() => {
  watchEffect((cleanup) => {
    if (props.startOfLine) return;
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
    );
  });
});
</script>

<template>
  <div ref="dragger" class="divider" :class="{ first: startOfLine }">
    <div class="thicc">
      <div v-if="!startOfLine" class="grip">
        <GripVertical />
      </div>
      <div class="button insert" @click="insertBar(barStart)">
        <Plus />
      </div>
      <div
        class="button delete"
        @click="deleteBar(barStart)"
        @mouseenter="emit('deleteHoverStart')"
        @mouseleave="emit('deleteHoverEnd')"
      >
        <Delete />
      </div>
      <template v-if="startOfLine">
        <div v-if="joinable" class="button join" @click="joinBreak(barStart)">
          <CornerRightUp />
        </div>
      </template>
      <div v-else class="button break" @click="insertBreak(barStart)">
        <CornerDownLeft />
      </div>
    </div>
  </div>
</template>

<style scoped>
.divider {
  width: var(--divider-width);
  height: 100%;
  background: var(--divider-color);
  padding: 0;
  position: relative;
  z-index: var(--divider-z-index);
  &:not(.first) {
    cursor: ew-resize;
  }
}

.thicc {
  display: grid;
  grid-template-rows: repeat(6, var(--cell-height));
  height: 100%;
  position: absolute;
  background: var(--divider-color);
  width: var(--note-font-size);
  transform: translateX(-25%);
  z-index: var(--divider-z-index);
}

/* .divider.first {
  justify-self: end;
  & .thicc {
    transform: translateX(-50%);
  }
} */

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
  color: var(--divider-icon-color);
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
