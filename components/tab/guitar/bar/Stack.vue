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
import type { DragType } from "../../dnd/types";
import {
  getNoteInputDragData,
  getNoteInputDropData,
  isNoteInputDragData,
} from "../../dnd/types";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { injectCellHoverEvents } from "../../providers/events/provide-cell-hover-events";
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
const resizeState = injectStackResizeObserver();
const tieAddState = injectTieAddState();
const cellHoverState = injectCellHoverEvents();

const selectionState = injectSelectionState();

const noteSpots = computed(() => {
  const noteSpots = new Array<GuitarNote | undefined>(props.tuning.length);
  for (const [string, note] of props.notes.entries()) {
    noteSpots[string] = note;
  }

  return noteSpots;
});

const isSelected = (string: number) =>
  selectionState.isSelected({ string, position: props.position });

const hovering = computed<number | false>(() => {
  const hoveredCell = cellHoverState.hoveredCell.value;
  if (
    hoveredCell?.position !== props.position ||
    typeof hoveredCell?.row !== "number"
  ) {
    return false;
  }
  return hoveredCell.row;
});

const tieable = (
  note: GuitarNote | undefined,
  string: number,
): note is { note: Midi } =>
  note !== undefined &&
  note.note !== "muted" &&
  editing.isEditing({ string, position: props.position });

// const dragging = reactive<Array<"tie-add" | "select" | undefined>>(
//   new Array(props.tuning.length).fill(undefined),
// );

// currently unused, see below
// const dropping = reactive<Array<DragType | undefined>>(
//   new Array(props.tuning.length).fill(undefined),
// );

const stackContainerRef = useTemplateRef("stack");
const noteContainerRefs = useTemplateRef("noteContainers");
const noteInputRefs = useTemplateRef("noteInputs");

const dndCleanups: CleanupFn[] = [];
onMounted(() => {
  resizeState.registerStackRef(props.position, stackContainerRef.value);
  for (const [string, container] of noteContainerRefs.value!.entries()) {
    const notePosition = { position: props.position, string };
    dndCleanups[string] = combine(
      dropTargetForElements({
        element: container,
        getData: () => getNoteInputDropData(notePosition),
        onDragEnter: (args) => {
          // if (isNoteInputDragData(args.source.data)) {
          //   dropping[string] = args.source.data.dragType;
          // }
        },
        onDragLeave: () => {
          // dropping[string] = undefined;
        },
        onDrop: (args) => {},
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
        onDragStart: () => {
          // dragging[string] = tieable(noteSpots.value[string], string)
          //   ? "tie-add"
          //   : "select";
          noteInputRefs.value![string]!.blur();
        },
        onDrop: () => {
          // dragging[string] = undefined;
        },
        getInitialData: () => {
          return getNoteInputDragData({
            ...notePosition,
            dragType: tieable(noteSpots.value[string], string)
              ? "tie-add"
              : "select",
            data: noteSpots.value[string],
          });
        },
      }),
    );
  }
});

function onMouseDown(e: MouseEvent, string: number) {
  if (!e.ctrlKey && !e.metaKey) {
    selectionState.clearSelections();
  }
}

function onNoteClick(e: MouseEvent, string: number) {
  // if (e.ctrlKey || e.metaKey) {
  selectionState.selectNote({ string, position: props.position });
  //   return;
  // }
  editing.setEditing({ string, position: props.position });
  noteInputRefs.value![string]!.focus(); // For when you click at the edge, outside the input
}

onUnmounted(() => {
  for (const cleanup of dndCleanups) {
    cleanup?.();
  }
});

const cursor = computed(() =>
  props.tuning.map((_, string) => {
    if (tieable(noteSpots.value[string], string)) {
      return "crosshair";
    }
    return "text";

    // NOTE: the following will not work; the cursor won't change during the drag process. I believe this is a limitation of the platform.
    // if (
    //   tieable(noteSpots.value[string], string) ||
    //   dropping[string] === "tie-add" ||
    //   dragging[string] === "tie-add"
    // ) {
    //   return "crosshair";
    // }
    // if (dropping[string] === "select" || dragging[string] === "select") {
    //   return "text";
    // }
    // return "text";
  }),
);
</script>

<template>
  <div ref="stack" class="stack">
    <div class="pos-line" />
    <div
      v-for="(note, string) in noteSpots"
      ref="noteContainers"
      class="container"
      :class="{
        selected: isSelected(string) && selectionState.action === 'none',
        tieable: tieable(note, string),
        collapse,
      }"
      :style="{ cursor: cursor[string], gridRow: string + 1 }"
      @click="(e) => onNoteClick(e, string)"
      @mousedown="(e) => onMouseDown(e, string)"
      @mouseenter="cellHoverState.hover(string, props.position)"
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
      <NoteInput
        ref="noteInputs"
        class="input"
        :data="note"
        :note-position="{ string, position: props.position }"
        :tuning="props.tuning[string]"
        :frets="props.frets"
        :hovering="hovering === string"
        :selected="isSelected(string) && selectionState.action === 'none'"
        @note-delete="emit('noteDelete', string)"
        @note-change="
          (updated) => emit('noteChange', string, { ...note, ...updated })
        "
      />
      <div
        v-if="isSelected(string) && selectionState.action !== 'none'"
        class="select-action-overlay"
        :class="{
          mightMove: selectionState.action === 'might-move',
          moving: selectionState.action === 'moving',
          mightDelete: selectionState.action === 'might-delete',
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;
}
.pos-line {
  grid-row: 1 / -1;
  grid-column: 1;
  width: 1px;
  background-color: lightgray;
  justify-self: center;
}
.container {
  grid-column: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: var(--cell-height);
  width: 100%;
  height: var(--cell-height);
  justify-items: center;
  align-items: center;

  &.selected {
    background-color: var(--highlight-color);
  }

  &.collapse {
    /* All this does is allow the @container rules to work */
    container-type: size;
  }

  &:not(.collapse) {
    min-width: var(--cell-height);
    justify-self: center;
  }
}

.select-action-overlay {
  width: 100%;
  height: 100%;
  grid-area: 1 / 1;
  pointer-events: none;

  &.mightMove {
    background-color: var(--might-move-color);
  }

  &.moving {
    background-color: var(--moving-color);
  }

  &.mightDelete {
    background-color: var(--delete-overlay-bg);
  }
}

.tie-add-dragger {
  background-color: red;
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
