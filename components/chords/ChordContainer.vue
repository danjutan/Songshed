<script lang="ts" setup>
import type { Chord, ChordNote, NoteStack } from "~/model/data";
import { Check, X, GripVertical } from "lucide-vue-next";
import ChordChart from "./ChordChart.vue";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  getChordDragData,
  getChordInsertDropData,
  isChordDragData,
} from "./dnd-types";

const props = defineProps<{
  chord: Chord;
  tuning: Midi[];
  index: number;
}>();

const emit = defineEmits<{
  delete: [];
}>();

const mightDelete = ref(false);
const mightMove = ref(false);
const moving = ref(false);
const moveTarget = ref(false);

const inplaceOpened = ref(false);

function deleteClicked() {
  mightDelete.value = false;
  emit("delete");
}

const moveHandleRef = useTemplateRef("moveHandle");
const droppableRef = useTemplateRef("droppable");

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      combine(
        draggable({
          element: moveHandleRef.value!,
          getInitialData: () => getChordDragData({ index: props.index }),
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            disableNativeDragPreview({ nativeSetDragImage });
            preventUnhandled.start();
          },
          onDragStart() {
            moving.value = true;
          },
          onDrop() {
            moving.value = false;
          },
        }),
        dropTargetForElements({
          element: droppableRef.value!,
          getData: () => getChordInsertDropData({ index: props.index }),
          onDropTargetChange(args) {
            if (isChordDragData(args.source.data)) {
              if (
                args.location.current.dropTargets[0].data.index ===
                args.self.data.index
              ) {
                moveTarget.value = true;
              } else {
                moveTarget.value = false;
              }
            }
          },
          onDrop(args) {
            moveTarget.value = false;
          },
        }),
      ),
    );
  });
});
</script>

<template>
  <div
    ref="droppable"
    class="chart-container"
    :class="{ 'inplace-opened': inplaceOpened, moving }"
  >
    <div class="title-row">
      <div class="left-filler" />
      <Inplace
        class="inplace"
        pt:display:class="inplace-display"
        pt:content:class="inplace-content"
        @open="inplaceOpened = true"
        @close="inplaceOpened = false"
      >
        <template #display>
          {{ chord.title || "..." }}
        </template>
        <template #content="{ closeCallback }">
          <InputText v-model="chord.title" class="title-input" />
          <Button class="icon-button" text @click="closeCallback">
            <template #icon>
              <Check :size="16" color="var(--p-green-600)" />
            </template>
          </Button>
        </template>
      </Inplace>

      <div class="buttons-container">
        <div
          ref="moveHandle"
          class="move-handle"
          @mouseenter="mightMove = true"
          @mouseleave="mightMove = false"
        >
          <GripVertical :size="16" />
        </div>
        <Button
          class="delete icon-button"
          text
          @mouseenter="mightDelete = true"
          @mouseleave="mightDelete = false"
          @click="deleteClicked"
        >
          <template #icon>
            <X :size="16" />
          </template>
        </Button>
      </div>
    </div>
    <ChordChart
      class="chart"
      :strings="props.tuning.length"
      :notes="props.chord.notes"
      :tuning="props.tuning"
      :highlight="
        (moving && 'moving') ||
        (mightMove && 'might-move') ||
        (mightDelete && 'might-delete') ||
        (moveTarget && 'move-target')
      "
      @update-string="(string, note) => props.chord.notes.set(string, note)"
      @mute-string="(string) => props.chord.notes.delete(string)"
    />
  </div>
</template>

<style scoped>
.chart-container {
  --control-width: 24px;
  /* position: relative; */
  display: flex;
  flex-direction: column;
  align-items: center;
  &:hover:not(.inplace-opened),
  &.moving {
    & .buttons-container {
      opacity: 1;
    }
    /* & .chart {
      width: 200px;
    } */
  }
}

.chart {
  width: 150px;
}

.title-row {
  display: flex;
  /* margin-left: var(--control-width); */
  transform: translateX(var(--control-width));
  width: calc(100% - var(--control-width));
  justify-content: space-between;
  align-items: center;
}

:deep(.inplace-display) {
  width: 96px;
  text-align: center;
}

:deep(.inplace-content) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-input {
  width: 80px;
  text-align: center;
  height: 32px;
  padding-inline: 2px;
}

.icon-button {
  width: 16px;
  height: 32px;
  padding: 0px;
}

.buttons-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.delete {
  cursor: pointer;
  color: var(--p-red-600);
  &:hover {
    font-weight: bold;
  }
}

.move-handle {
  cursor: move;
}

.left-filler {
  width: 24px;
}
</style>
