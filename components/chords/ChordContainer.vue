<script lang="ts" setup>
import type { Chord, ChordNote, NoteStack } from "~/model/data";
import { detectChord } from "~/theory/notes";
import { Check, Delete, Pencil } from "lucide-vue-next";
import ChordDiagram from "./ChordDiagram.vue";
import ChordSelect from "./ChordSelect.vue";

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
import type { Midi } from "~/theory/notes";

const props = defineProps<{
  chord: Chord;
  tuning: Midi[];
  index: number;
}>();

const emit = defineEmits<{
  delete: [];
}>();

// Watch for note changes and auto-detect chord title
watch(
  () => [...props.chord.notes.entries()],
  () => {
    if (props.chord.autoTitle !== false) {
      const detected = detectChord(props.chord.notes);
      props.chord.title = detected ?? "";
    }
  },
  { deep: true },
);

function onTitleChange(newTitle: string | undefined) {
  const title = newTitle ?? "";
  props.chord.title = title;
  // Empty title = resume auto-detect, non-empty = manual mode
  props.chord.autoTitle = title === "";
}

const mightDelete = ref(false);
const mightMove = ref(false);
const moving = ref(false);
const moveTarget = ref(false);

const highlight = computed(
  () =>
    (moving.value && "moving") ||
    (mightMove.value && "might-move") ||
    (mightDelete.value && "might-delete") ||
    (moveTarget.value && "move-target") ||
    false,
);

const inplaceOpened = ref(false);

function deleteClicked() {
  mightDelete.value = false;
  emit("delete");
}

// const containerRef = useTemplateRef("container");
const titleRowRef = useTemplateRef("titleRow");
const diagramRef = useTemplateRef("diagram");

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      combine(
        ...[titleRowRef.value!, diagramRef.value!].map((el) =>
          draggable({
            element: el,
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
        ),
        ...[titleRowRef.value!, diagramRef.value!].map((el) =>
          dropTargetForElements({
            element: el,
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
      ),
    );
  });
});
</script>

<template>
  <div
    class="chart-container"
    :class="{ 'inplace-opened': inplaceOpened, moving }"
  >
    <div v-if="highlight" :class="highlight" class="highlight" />
    <div ref="titleRow" class="title-row">
      <!-- <div class="left-filler" /> -->
      <Inplace
        class="inplace"
        pt:display:class="inplace-display"
        pt:content:class="inplace-content"
        @open="inplaceOpened = true"
        @close="inplaceOpened = false"
      >
        <template #display>
          <span />
          {{ chord.title || "..." }}
          <span class="edit-icon">
            <Pencil :size="12" />
          </span>
        </template>
        <template #content="{ closeCallback }">
          <InputText
            :model-value="chord.title"
            class="title-input"
            @update:model-value="onTitleChange"
          />
          <Button class="icon-button" text @click="closeCallback">
            <template #icon>
              <Check :size="16" color="var(--p-green-600)" />
            </template>
          </Button>
          <Button
            class="delete icon-button"
            text
            @mouseenter="mightDelete = true"
            @mouseleave="mightDelete = false"
            @click="deleteClicked"
          >
            <template #icon>
              <Delete :size="16" />
            </template>
          </Button>
        </template>
      </Inplace>

      <!-- <div class="buttons-container">
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
      </div> -->
    </div>
    <ChordSelect class="chord-select" />
    <div ref="diagram" class="diagram-container">
      <ChordDiagram
        :notes="props.chord.notes"
        :tuning="props.tuning"
        :interactive="true"
        @update-string="(string, note) => props.chord.notes.set(string, note)"
        @mute-string="(string) => props.chord.notes.delete(string)"
      />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  --diagram-width: 150px;
  --control-width: 24px;
  --icon-width: 16px;
  width: 180px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  &:hover:not(.inplace-opened),
  &.moving {
    & .buttons-container {
      opacity: 1;
    }
    /* & .chart {
      width: 200px;
    } */
  }
  &.moving {
    cursor: grabbing;
  }
}

.diagram-container {
  width: var(--diagram-width);
}

.chord-select {
  margin-left: calc(var(--control-width) * 0.5);
  position: relative;
}

.highlight {
  position: absolute;
  inset: -10px -6px 10px 10px;
  pointer-events: none;
  opacity: var(--select-alpha);

  &.might-delete {
    background: var(--delete-color);
  }

  &.might-move {
    background: var(--might-move-color);
  }

  &.moving {
    background: var(--moving-color);
  }

  &.move-target {
    background: var(--move-target-color);
  }
}

.title-row {
  display: flex;
  width: var(--diagram-width);
  justify-content: center;
  margin-right: calc(-0.5 * (var(--control-width) + var(--icon-width)));
  margin-bottom: 12px;
}

.inplace {
  width: 100%;
}

:deep(.inplace-display) {
  display: flex;
  justify-content: space-between;
  text-align: center;

  & .edit-icon {
    width: var(--icon-width);
    margin-right: calc(var(--icon-width) * -0.5);
    height: var(--icon-width);
  }
}

:deep(.inplace-content) {
  width: calc(100% + var(--icon-width) * 1.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-input {
  width: calc(
    var(--diagram-width) - var(--control-width) - var(--icon-width) * 0.5
  );
  text-align: center;
  /* height: 32px; */
  /* padding-inline: 2px; */
}

.icon-button {
  width: var(--icon-width);
  height: 32px;
  padding: 0px;
  &:hover svg {
    stroke-width: 3;
  }
  &.delete {
    cursor: pointer;
  }
}

.buttons-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.left-filler {
  width: 24px;
}
</style>
