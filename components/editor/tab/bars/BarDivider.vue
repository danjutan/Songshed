<script lang="ts" setup>
import type { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/types";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  GripVertical,
  Plus,
  Delete,
  CornerRightUp,
  CornerDownLeft,
  Ellipsis,
} from "lucide-vue-next";
import { injectBarManagement } from "~/components/editor/tab/providers/state/provide-bar-management";
import { getBarDragData, isInsertBarDropData } from "~/components/editor/tab/hooks/dnd/dnd-types";

const resizeRef = useTemplateRef("resize");
const moveRef = useTemplateRef("move");
const { insertBar, deleteBar, insertBreak, joinBreak, insertTimeChange } =
  injectBarManagement();

const props = defineProps<{
  startOfLine: boolean;
  barStart: number;
  joinable: boolean;
}>();

const emit = defineEmits<{
  resize: [diffX: number];
  deleteHoverStart: [];
  deleteHoverEnd: [];
  moveHoverStart: [];
  moveHoverEnd: [];
  moveDragStart: [];
  moveDragEnd: [];
  insertingInto: [number];
}>();

const expanded = ref(false);

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      combine(
        // draggable({
        //   element: resizeRef.value!,
        //   onGenerateDragPreview({ nativeSetDragImage }) {
        //     disableNativeDragPreview({ nativeSetDragImage });
        //     preventUnhandled.start();
        //   },
        //   onDragStart() {},
        //   onDrag({ location }) {
        //     if (props.startOfLine) return;
        //     const diffX =
        //       location.current.input.clientX - location.initial.input.clientX;
        //     emit("resize", diffX);
        //   },
        //   onDrop() {
        //     preventUnhandled.stop();
        //   },
        // }),
        draggable({
          element: moveRef.value!,
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            disableNativeDragPreview({ nativeSetDragImage });
            preventUnhandled.start();
          },
          onDragStart() {
            emit("moveDragStart");
          },
          onDrop() {
            emit("moveDragEnd");
          },
          onDropTargetChange(args) {
            const insertBarTarget = args.location.current.dropTargets.find(
              (target) => isInsertBarDropData(target.data),
            );
            if (insertBarTarget && isInsertBarDropData(insertBarTarget.data)) {
              emit("insertingInto", insertBarTarget.data.position);
            }
          },
          getInitialData: () => getBarDragData({ barStart: props.barStart }),
        }),
      ),
    );
  });
});
</script>

<template>
  <div
    ref="resize"
    class="divider"
    :class="{ first: startOfLine }"
    @mouseleave="expanded = false"
  >
    <div class="thicc">
      <div
        ref="move"
        class="grip"
        @mouseenter="emit('moveHoverStart')"
        @mouseleave="emit('moveHoverEnd')"
      >
        <GripVertical />
      </div>
      <div class="button insert" @click="insertBar(barStart)">
        <Plus />
      </div>
      <div class="bottom-buttons">
        <div
          class="button delete"
          @click="deleteBar(barStart)"
          @mouseenter="emit('deleteHoverStart')"
          @mouseleave="emit('deleteHoverEnd')"
        >
          <Delete />
        </div>
        <div class="button more" @mouseenter="expanded = !expanded">
          <Ellipsis />
        </div>
      </div>
    </div>
    <div v-if="expanded" class="expanded">
      <div class="button time" @click="insertTimeChange(barStart)">
        <div>&#xE084;</div>
        <div>&#xE084;</div>
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
  min-width: var(--divider-width);
  background: var(--divider-color);
  padding: 0;
  position: relative;
  z-index: var(--divider-z-index);
  align-self: stretch;
  /* &:not(.first) {
    cursor: ew-resize;
  } */
}

.divider:hover {
  z-index: var(--divider-hover-z-index);
}

.thicc,
.expanded {
  /* display: grid;
  grid-template-rows: repeat(4, 1fr); */
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: absolute;
  background: var(--divider-color);
  width: calc(var(--note-font-size) + 4px);
  transform: translateX(-25%);
}

.thicc {
  justify-content: space-between;
}

.expanded {
  left: calc(var(--note-font-size) + 3px);
  justify-content: flex-end;

  & .time {
    font-family: "Leland", serif;
    font-size: 16px;
    line-height: 9px;
    margin-bottom: 4px;
  }
}

.bottom-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & .delete {
    height: 16px;
    margin-top: 6px;
    transform: rotate(180deg);
  }

  & .more {
    margin-top: -2px;
  }
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
  cursor: move;
  transform: translateY(2px);
}

.button {
  cursor: pointer;
  grid-column: 1;
  color: var(--p-surface-50);
  &:hover {
    font-weight: bold;
    & svg {
      stroke-width: 3;
    }
  }
}

/* .insert {
  grid-row: -4;
  align-self: center;
}
.delete {
  grid-row: -3;
}

.break,
.join {
  grid-row: -2;
} */

svg {
  color: var(--divider-icon-color);
  width: var(--context-menu-height);
}
</style>
