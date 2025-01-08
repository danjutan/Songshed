<script lang="ts" setup>
import type { GuitarNote, NoteStack } from "~/model/data";
import NoteInput from "./NoteInput.vue";
import { injectTieAddState } from "../../providers/state/provide-tie-add-state";
import { injectSelectionState } from "../../providers/state/provide-selection-state";
import { injectEditingState } from "../../providers/state/provide-editing-state";
import { injectStackResizeObserver } from "../../providers/events/provide-resize-observer";

import Draggable from "../../dnd/Draggable.vue";
import DropTarget from "../../dnd/DropTarget.vue";

import type { DragType } from "../../dnd/types";
import {
  getNoteInputDragData,
  getNoteInputDropData,
  isNoteInputDragData,
} from "../../dnd/types";

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

const { isSelected, selectNote, clearSelections } = injectSelectionState();

const noteSpots = computed(() => {
  const noteSpots = new Array<GuitarNote | undefined>(props.tuning.length);
  for (const [string, note] of props.notes.entries()) {
    noteSpots[string] = note;
  }

  return noteSpots;
});

const hovering = ref<number | undefined>();

const tieable = (
  note: GuitarNote | undefined,
  string: number,
): note is { note: Midi } =>
  note !== undefined &&
  note.note !== "muted" &&
  editing.isEditing({ string, position: props.position });

const dragging = reactive<Array<"tie-add" | "select" | undefined>>(
  new Array(props.tuning.length).fill(undefined),
);

// currently unused, see below
const dropping = reactive<Array<DragType | undefined>>(
  new Array(props.tuning.length).fill(undefined),
);

const stackContainerRef = useTemplateRef("stack");
const noteContainerRefs = useTemplateRef("noteContainers");
const noteInputRefs = useTemplateRef("noteInputs");

onMounted(() => {
  resizeState.registerStackRef(props.position, stackContainerRef.value);
});

function onMouseDown(e: MouseEvent, string: number) {
  if (!e.ctrlKey && !e.metaKey) {
    clearSelections();
  }
}

function onNoteClick(e: MouseEvent, string: number) {
  selectNote({ string, position: props.position });
  editing.setEditing({ string, position: props.position });
  noteInputRefs.value![string]!.focus(); // For when you click at the edge, outside the input
}

const cursor = computed(() =>
  props.tuning.map((_, string) => {
    if (
      tieable(noteSpots.value[string], string) ||
      dragging[string] === "tie-add"
    ) {
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
    <div
      v-for="(note, string) in noteSpots"
      ref="noteContainers"
      class="container"
      :class="{
        selected: isSelected({ string, position: props.position }),
        tieable: tieable(note, string),
        collapse,
      }"
      :style="{ cursor: cursor[string] }"
      @click="(e) => onNoteClick(e, string)"
      @mousedown="(e) => onMouseDown(e, string)"
      @mouseenter="hovering = string"
      @mouseleave="hovering = undefined"
    >
      <DropTarget
        :data="getNoteInputDropData({ position: props.position, string })"
        @drag-enter="
          (args) => {
            if (isNoteInputDragData(args.source.data)) {
              dropping[string] = args.source.data.dragType;
            }
          }
        "
        @drag-leave="() => (dropping[string] = undefined)"
      >
        <Draggable
          :data="
            getNoteInputDragData({
              position: props.position,
              string,
              dragType: tieable(noteSpots[string], string)
                ? 'tie-add'
                : 'select',
              data: noteSpots[string],
            })
          "
          disable-preview
          @drag-start="
            () => {
              dragging[string] = tieable(noteSpots[string], string)
                ? 'tie-add'
                : 'select';
              noteInputRefs![string]!.blur();
            }
          "
          @drop="() => (dragging[string] = undefined)"
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
            :selected="isSelected({ string, position: props.position })"
            @note-delete="emit('noteDelete', string)"
            @note-change="
              (updated) => emit('noteChange', string, { ...note, ...updated })
            "
          />
        </Draggable>
      </DropTarget>
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;
}

.container {
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

.tie-add-dragger {
  width: 100%;
  height: 100%;
  background-color: red;
  grid-area: 1 / 1;
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
