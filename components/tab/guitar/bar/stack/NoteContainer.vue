<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";
import NoteInput from "./NoteInput.vue";
import { injectSelectionState } from "../../../providers/state/provide-selection-state";
import { injectEditingState } from "../../../providers/state/provide-editing-state";
import { injectCellHoverEvents } from "../../../providers/events/provide-cell-hover-events";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  getNoteInputDragData,
  getNoteInputDropData,
  type TieAddDragDataProps,
} from "../../../hooks/dnd/types";
import NoteTieDragger from "./NoteTieDragger.vue";

const props = defineProps<{
  note: GuitarNote | undefined;
  string: number;
  position: number;
  tuning: Midi;
  frets: number;
  collapse?: boolean;
}>();

const emit = defineEmits<{
  noteDelete: [];
  noteChange: [note: GuitarNote];
}>();

const editing = injectEditingState();
const selectionState = injectSelectionState();
const cellHoverState = injectCellHoverEvents();

const noteInputRef = ref<InstanceType<typeof NoteInput>>();
const containerRef = ref<HTMLElement>();

const isSelected = computed(() =>
  selectionState.isSelected({ string: props.string, position: props.position }),
);

const hovering = computed<boolean>(() => {
  const hoveredCell = cellHoverState.hoveredCell.value;
  return (
    hoveredCell?.position === props.position &&
    hoveredCell?.row === props.string
  );
});

const tieable = computed(
  () =>
    props.note !== undefined &&
    props.note.note !== "muted" &&
    editing.isEditing({ string: props.string, position: props.position }),
);

const dragData = computed(() => {
  return {
    position: props.position,
    string: props.string,
    data: props.note,
  };
});

const tieableDragData = computed<Omit<TieAddDragDataProps, "type"> | undefined>(
  () => {
    if (!props.note) {
      return undefined;
    }
    return {
      position: props.position,
      string: props.string,
      data: props.note,
    };
  },
);

onMounted(() => {
  watchEffect((cleanup) =>
    cleanup(
      combine(
        dropTargetForElements({
          element: containerRef.value!,
          getData: () =>
            getNoteInputDropData({
              position: props.position,
              string: props.string,
            }),
          onDrop: () => {},
        }),
        draggable({
          element: containerRef.value!,
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            disableNativeDragPreview({ nativeSetDragImage });
            preventUnhandled.start();
          },
          onDragStart: () => {
            noteInputRef.value?.blur();
          },
          getInitialData: () => {
            return getNoteInputDragData({
              ...dragData.value,
              dragType: "select",
            });
          },
        }),
      ),
    ),
  );
});

function onMouseDown(e: MouseEvent) {
  if (!e.ctrlKey && !e.metaKey) {
    selectionState.clearSelections();
  }
}

function onNoteClick(e: MouseEvent) {
  selectionState.selectNote({ string: props.string, position: props.position });
  editing.setEditing({ string: props.string, position: props.position });
  noteInputRef.value?.focus();
}
</script>

<template>
  <div
    ref="containerRef"
    class="container"
    :class="{
      selected: isSelected && selectionState.action === 'none',
      hovering,
      tieable,
      collapse,
    }"
    :style="{ gridRow: string + 1 }"
    @click="onNoteClick"
    @mousedown="onMouseDown"
    @mouseenter="cellHoverState.hover(string, position)"
  >
    <div class="selected-bg" />
    <!-- <div
      v-if="note"
      class="square"
      :style="{
        backgroundColor:
          note.note === 'muted' ? 'gray' : defaultColors[getChroma(note.note)],
      }"
    /> -->
    <div v-if="note" class="note-block">{{ noteInputRef?.noteText }}</div>
    <div v-else class="fill-intersection" />

    <div class="string left" />
    <div class="string right" />

    <div class="pos-line top" />
    <div class="pos-line bottom" />

    <NoteInput
      ref="noteInputRef"
      class="input"
      :data="note"
      :note-position="{ string, position }"
      :tuning="tuning"
      :frets="frets"
      :hovering="hovering"
      :selected="isSelected && selectionState.action === 'none'"
      @note-delete="emit('noteDelete')"
      @note-change="(updated) => emit('noteChange', { ...note, ...updated })"
    />

    <template v-if="tieable && tieableDragData">
      <NoteTieDragger mode="tie" :drag-props="tieableDragData" />
      <NoteTieDragger mode="bend" :drag-props="tieableDragData" />
    </template>

    <div
      v-if="selectionState.action !== 'none' && isSelected"
      class="select-action-overlay"
      :class="{
        mightMove: selectionState.action === 'might-move',
        moving: selectionState.action === 'moving',
        mightDelete: selectionState.action === 'might-delete',
      }"
    />
  </div>
</template>

<style scoped>
.container {
  grid-column: 1;
  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  grid-template-rows: 1fr min-content 1fr;
  width: 100%;
  height: var(--cell-height);
  justify-items: center;
  align-items: center;
  font-size: var(--note-font-size);

  &.collapse {
    container-type: size;
  }

  &:not(.collapse) {
    /* min-width: var(--cell-height); */
    /* justify-self: center; */
    &.tieable {
      min-width: calc(var(--cell-height) + 12px);
    }
  }
}

.selected .selected-bg {
  width: 100%;
  height: 100%;
  grid-area: 1 / 1 / -1 / -1;
  background-color: rgb(from var(--select-color) r g b / var(--select-alpha));
}

.input {
  grid-area: 1 / 1 / -1 / -1;
}

.note-block {
  grid-area: 2 / 2;
  color: transparent;
}

.string {
  height: 1px;
  width: 100%;
  background-color: var(--string-color);
  align-self: center;

  &.left {
    grid-area: 2 / 1;
  }

  &.right {
    grid-area: 2 / 3;
  }
}

.pos-line {
  width: 1px;
  height: 100%;
  background-color: var(--pos-line-color);
  justify-self: center;

  &.top {
    grid-area: 1 / 2;
  }

  &.bottom {
    grid-area: 3 / 2;
  }
}

.fill-intersection {
  grid-area: 2 / 2;
  background-color: var(--string-color);
  width: 1px;
  height: 1px;
}

.select-action-overlay {
  width: 100%;
  height: 100%;
  grid-area: 1 / 1 / -1 / -1;
  pointer-events: none;
  opacity: var(--select-alpha);

  &.mightMove {
    background-color: var(--might-move-color);
  }

  &.moving {
    background-color: var(--moving-color);
  }

  &.mightDelete {
    background-color: var(--delete-color);
  }
}

/* .square {
  width: 80%;
  max-width: calc(var(--cell-height) / 2);
  aspect-ratio: 1;
  background-color: blue;
  display: none;
} */

/* TODO: make hammer/pull off labels (shrink and) disappear at some point */

/* Variables don't work in queries, so we use aspect-ratio to figure out if it's too narrow relative to var(--cell-height).
   That's why this component is the container and not Stack */
@container (aspect-ratio < 0.8) {
  .input,
  .note-block {
    font-size: 100cqi;
  }
}

/* @container (aspect-ratio < 0.45) {
  .square {
    display: block;
  }
  .input {
    display: none;
  }
}

@container (aspect-ratio < 0.1) {
  .square {
    display: none;
  }
} */

/* ... rest of the styles from Stack.vue ... */
</style>
