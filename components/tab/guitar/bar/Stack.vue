<script lang="ts" setup>
import type { GuitarNote, NoteStack } from "~/model/data";
import NoteInput from "./NoteInput.vue";
import { injectTieAddState } from "../../providers/state/provide-tie-add-state";
import { injectSelectionState } from "../../providers/state/provide-selection-state";
import { injectEditingState } from "../../providers/state/provide-editing-state";
import { injectStackResizeObserver } from "../../providers/events/provide-resize-observer";

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getNoteInputDragData, getNoteInputDropData } from "../../dnd/types";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
const props = withDefaults(
  defineProps<{
    notes: NoteStack<GuitarNote>;
    position: number;
    frets: number;
    tuning: Midi[];
    collapse?: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  noteDelete: [string: number];
  noteChange: [string: number, note: GuitarNote];
}>();

const editing = injectEditingState();
const tieAdd = injectTieAddState();
const resizeState = injectStackResizeObserver();
const { isSelected, selectNote, selections } = injectSelectionState();

const noteSpots = computed(() => {
  const noteSpots = new Array<GuitarNote | undefined>(props.tuning.length);
  for (const [string, note] of props.notes.entries()) {
    noteSpots[string] = note;
  }

  return noteSpots;
});

// const backgroundColor = computed(() =>
//   selected.value ? "var(--highlight-color)" : "transparent",
// );

const hovering = ref<number | undefined>();

// TODO: move to child
// function onStackMouseMove() {
//   if (selecting.dragging) (document.activeElement as HTMLElement).blur();
// }

const inputRefs = useTemplateRef("inputs");

const tieable = (
  note: GuitarNote | undefined,
  string: number,
): note is { note: Midi } =>
  note !== undefined &&
  note.note !== "muted" &&
  editing.isEditing({ string, position: props.position });

function onSpotMouseDown(
  e: MouseEvent,
  string: number,

  note: GuitarNote | undefined,
) {
  if (tieable(note, string)) {
    tieAdd.start(string, props.position, note!.note);
    e.preventDefault(); //prevents default drag-drop behavior
    e.stopPropagation(); //prevents onStackMouseDown from triggering
  }
}

const stackContainerRef = useTemplateRef("stack");
const noteContainerRefs = useTemplateRef("noteContainers");

const dndCleanups: CleanupFn[] = [];
onMounted(() => {
  resizeState.registerStackRef(props.position, stackContainerRef.value);
  for (const [string, container] of noteContainerRefs.value!.entries()) {
    const notePosition = { position: props.position, string };
    dndCleanups[string] = combine(
      dropTargetForElements({
        element: container,
        getData: () => getNoteInputDropData(notePosition),
        // onDragEnter: focus,
      }),
      draggable({
        element: container,
        onGenerateDragPreview: ({ nativeSetDragImage, source }) => {
          // if (source.data.selecting) {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
          // }
        },
        getInitialData: () =>
          getNoteInputDragData({
            ...notePosition,
            dragType: editing.isEditing(notePosition) ? "tie-add" : "select",
            data: noteSpots.value[string],
          }),
      }),
    );
  }
});

onUnmounted(() => {
  for (const cleanup of dndCleanups) {
    cleanup?.();
  }
});
</script>

<template>
  <div ref="stack" class="stack">
    <div
      v-for="(note, string) in noteSpots"
      ref="noteContainers"
      class="container"
      :class="{
        selected: isSelected({ string, position: props.position }),
        crosshair: tieable(note, string),
        collapse,
      }"
      @click="() => selectNote({ string, position: props.position })"
      @mouseenter="hovering = string"
      @mouseleave="hovering = undefined"
    >
      <div
        v-if="collapse && note"
        class="square"
        :style="{
          backgroundColor:
            note.note === 'muted'
              ? 'gray'
              : defaultColors[getChroma(note.note)],
        }"
      />
      <div class="input">
        <NoteInput
          ref="inputs"
          :data="note"
          :note-position="{ string, position: props.position }"
          :tuning="props.tuning[string]"
          :frets="props.frets"
          :hovering="hovering === string"
          :selected="isSelected({ string, position: props.position })"
          @note-delete="emit('noteDelete', string)"
          @note-change="
            (updated) => emit('noteChange', string, { ...note, ...updated })
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;
}

.container {
  display: flex;
  height: var(--cell-height);
  justify-content: center;
  align-items: center;
  cursor: text;
}

.container.selected {
  background-color: var(--highlight-color);
}

.container.crosshair {
  cursor: crosshair;
}

.container.collapse {
  container-type: size;
}

.container:not(.collapse) {
  width: var(--cell-height);
  justify-self: center;
}

.square {
  width: 80%;
  max-width: calc(var(--cell-height) / 2);
  aspect-ratio: 1;
  background-color: blue;
  display: none;
}

.input {
  font-size: var(--note-font-size);
}

@container (aspect-ratio < 0.8) {
  .input {
    font-size: 100cqi;
  }
}

@container (aspect-ratio < 0.45) {
  .square {
    display: block;
  }
  .input {
    display: none;
  }
}

/* @container (aspect-ratio < 0.2) {
  .square {
    width: 100%;
  }
} */

@container (aspect-ratio < 0.1) {
  .square {
    display: none;
  }
}
</style>
