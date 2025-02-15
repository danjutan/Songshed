<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";
import NoteInput from "./NoteInput.vue";
import { injectSelectionState } from "~/components/tab/providers/state/provide-selection-state";
import { injectEditingState } from "~/components/tab/providers/state/provide-editing-state";
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
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
} from "~/components/tab/hooks/dnd/types";
import NoteTieDragger from "./NoteTieDragger.vue";
import { X } from "lucide-vue-next";
import { injectTieAddState } from "~/components/tab/providers/state/provide-tie-add-state";
import type { NotePosition } from "~/model/stores";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import { injectNotePreviewState } from "~/components/tab/providers/state/provide-note-preview-state";
import SelectionToolbar from "../selections/SelectionToolbar.vue";

const props = defineProps<{
  note: GuitarNote | undefined;
  notePosition: NotePosition;
  tuning: Midi;
  frets: number;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  noteDelete: [];
  noteChange: [note: GuitarNote];
}>();

const editing = injectEditingState();
const selectionState = injectSelectionState();
const cellHoverState = injectCellHoverEvents();
const { hasTieBothSides, hasBend } = injectTieAddState();
const settings = injectSettingsState();
const { useNotePreview } = injectNotePreviewState();

const noteInputRef = ref<InstanceType<typeof NoteInput>>();
const containerRef = ref<HTMLElement>();

const notePreview = useNotePreview(props.notePosition);

const isSelected = computed(() =>
  selectionState.isSelectedPosition(props.notePosition),
);

const isOnlySelection = computed(
  () => isSelected.value && selectionState.selections.size === 1,
);

const isEditing = ref(false);
const tieable = computed(
  () =>
    props.note !== undefined && props.note.note !== "muted" && isEditing.value,
);
const tieing = ref(false);

const dragData = computed(() => {
  return {
    position: props.notePosition.position,
    string: props.notePosition.string,
    data: props.note,
  };
});

const tieableDragData = computed<Omit<TieAddDragDataProps, "mode"> | undefined>(
  () => {
    if (!props.note) {
      return undefined;
    }
    return {
      position: props.notePosition.position,
      string: props.notePosition.string,
      data: props.note,
    };
  },
);

// TODO: extract into a provider
const ctrlState = useKeyModifier("Control");
const metaState = useKeyModifier("Meta");

watchEffect((cleanup) => {
  if (!containerRef.value || !noteInputRef.value) {
    return;
  }
  cleanup(
    combine(
      dropTargetForElements({
        element: containerRef.value!,
        getData: () =>
          getNoteInputDropData({
            position: props.notePosition.position,
            string: props.notePosition.string,
          }),
      }),
      ...[containerRef.value!, noteInputRef.value!.el!].map((el) =>
        draggable({
          element: el,
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

function onClick(e: MouseEvent) {
  noteInputRef.value?.focus();
}

// Makes sure we clear the selection when we start draggging.
// We want this to happen early - this isn't in onDragStart because if it was, if the note was dragged from the input,
// it would select itself, then visibly unselect itself before selecting again
function onMouseDown(e: MouseEvent) {
  if (!ctrlState.value && !metaState.value) {
    selectionState.clearSelections();
  }
}

function onNoteFocus() {
  if (!ctrlState.value && !metaState.value) {
    selectionState.clearSelections();
  }
  selectionState.selectNote({
    string: props.notePosition.string,
    position: props.notePosition.position,
  });
  editing.setEditing({
    string: props.notePosition.string,
    position: props.notePosition.position,
  });
  isEditing.value = true;
}

function onNoteBlur() {
  isEditing.value = false;
}

// Handles the case where the user drags the text of the note input itself, rather than the `draggable`
function onNoteDragStart(e: DragEvent) {
  isEditing.value = false;
}
// onBeforeUpdate(() => {
//   console.log("updated", props.position, props.string);
// });

// onRenderTriggered((e) => {
//   console.log("render", props.position, props.string);
// });

// onRenderTracked((e) => {
//   console.log("tracked", props.position, props.string, e);
// });
const noteText = computed(() => {
  const sourceData = notePreview.value ?? props.note;
  if (sourceData) {
    if (sourceData.note === "muted") {
      return "X";
    }
    return "" + (sourceData.note - props.tuning);
  }
  return "";
});

const row = computed(() => props.notePosition.string + 1);
</script>

<template>
  <div
    ref="containerRef"
    class="container"
    :class="{
      selected: isSelected && selectionState.action === 'none',
      tieable,
      tieing,
      collapsed,
      'pos-line-center': settings.posLineCenter,
    }"
    :style="{ gridRow: notePosition.string + 1 }"
    @click="onClick"
    @mousedown="onMouseDown"
    @mouseenter="
      cellHoverState.hover(notePosition.string, notePosition.position)
    "
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
    <div
      v-if="note || notePreview"
      class="note-block"
      :class="{ preview: notePreview }"
    >
      {{ noteText }}
    </div>
    <div v-else class="fill-intersection" />

    <div class="string left" />
    <div class="string right" />

    <template v-if="settings.posLineCenter">
      <div class="pos-line top" />
      <div class="pos-line bottom" />
    </template>

    <NoteInput
      v-show="!notePreview"
      ref="noteInputRef"
      class="input"
      :class="{
        muted: note?.note === 'muted',
      }"
      :data="note"
      :note-position="notePosition"
      :tuning="tuning"
      :frets="frets"
      :note-text="noteText"
      :selected="isSelected && selectionState.action === 'none'"
      @dragstart="onNoteDragStart"
      @focus="onNoteFocus"
      @blur="onNoteBlur"
      @note-delete="emit('noteDelete')"
      @note-change="
        (updated: GuitarNote) => emit('noteChange', { ...note, ...updated })
      "
    />

    <X v-if="note?.note === 'muted'" :size="20" class="muted-icon" />

    <template v-if="(tieable || tieing) && tieableDragData">
      <NoteTieDragger
        v-if="!hasTieBothSides(notePosition)"
        mode="tie"
        :drag-props="tieableDragData"
        @mousedown="tieing = true"
        @drag-end="tieing = false"
      />
      <NoteTieDragger
        v-if="!hasBend(notePosition)"
        mode="bend"
        :drag-props="tieableDragData"
        @mousedown="tieing = true"
        @drag-end="tieing = false"
      />
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

    <SelectionToolbar
      v-if="isOnlySelection"
      class="selection-toolbar"
      :region="{
        minString: notePosition.string,
        minPosition: notePosition.position,
        maxString: notePosition.string,
        maxPosition: notePosition.position,
      }"
      :top="`calc(var(--cell-height) / -8)`"
      @click.stop="() => {}"
      @mousedown.stop="() => {}"
    />
  </div>
</template>

<style scoped>
.container {
  grid-column: 1;
  grid-row: v-bind(row);

  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  grid-template-rows: 1fr min-content 1fr;
  justify-items: center;
  align-items: center;

  position: relative;

  width: 100%;
  height: var(--cell-height);

  font-size: var(--note-font-size);

  container-type: size;

  min-width: var(--cell-height);
  &.collapsed {
    min-width: var(--collapsed-min-width);
  }

  &.tieable,
  &.tieing {
    min-width: calc(var(--cell-height) + 12px);
  }

  &:hover,
  &.tieable {
    .note-block:not(.preview) {
      color: transparent;
    }
    .input {
      display: block;
    }
  }

  &:not(:hover) {
    .selection-toolbar {
      display: none;
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
  display: none;
  grid-area: 1 / 1 / -1 / -1;
  background-color: rgb(
    from var(--note-hover-color) r g b / var(--select-alpha)
  );
  &.muted {
    color: transparent;
  }
}

.note-block {
  grid-area: 2 / 2;
  &.preview {
    opacity: 0.5;
  }
}

.muted-icon {
  grid-area: 1 / 1 / -1 / -1;
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
  width: var(--pos-line-width);
  z-index: var(--pos-line-z-index);
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

@container (aspect-ratio < 0.45) {
  .pos-line {
    display: none;
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
