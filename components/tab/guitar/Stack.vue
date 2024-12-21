<script lang="ts" setup>
import type { GuitarNote, NoteStack } from "~/model/data";
import NoteInput from "./NoteInput.vue";
import {
  SelectionInjectionKey,
  type SelectionState,
} from "./providers/selection-state";
import {
  TieAddInjectionKey,
  type TieAddState,
} from "./providers/tie-add-state";

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

const selecting = inject(SelectionInjectionKey) as SelectionState;
const tieAdd = inject(TieAddInjectionKey) as TieAddState;

const noteSpots = computed(() => {
  const noteSpots = new Array(props.tuning.length);
  for (const [string, note] of props.notes.entries()) {
    noteSpots[string] = note;
  }

  return noteSpots;
});

const selected = computed(() => selecting.isSelected(props.position));

const backgroundColor = computed(() =>
  selected.value ? "var(--highlight-color)" : "transparent",
);

const hovering = ref<number | undefined>();

function onStackMouseDown() {
  selecting.start(props.position);
}

function onStackMouseMove() {
  selecting.drag(props.position);
  if (selecting.dragging) (document.activeElement as HTMLElement).blur();
}

function onSpotMouseEnter(string: number) {
  hovering.value = string;
  const midi = props.notes.get(string)?.midi;
  tieAdd.drag(props.position, midi);
}

function onSpotMouseUp() {
  tieAdd.end();
}

type InputRef = InstanceType<typeof NoteInput> | null;
const inputRefs = ref<InputRef[]>([]);
</script>

<template>
  <div
    class="stack"
    @mousedown="onStackMouseDown"
    @mousemove="onStackMouseMove"
  >
    <div
      v-for="(note, string) in noteSpots"
      class="container"
      :class="{
        collapse: selecting.editingNote?.position !== position && collapse,
      }"
      @mouseup="onSpotMouseUp"
      @mouseenter="onSpotMouseEnter(string)"
      @click="inputRefs[string]?.focus()"
      @mouseleave="hovering = undefined"
    >
      <div
        v-if="collapse && note"
        class="square"
        :style="{
          backgroundColor: defaultColors[getChroma(note.midi)],
        }"
      />
      <div class="input">
        <NoteInput
          :ref="(el) => inputRefs.push(el as InputRef)"
          :data="note"
          :string="string"
          :position="position"
          :tuning="props.tuning[string]"
          :frets="props.frets"
          :blocking-color="selected ? 'var(--highlight-blocking)' : undefined"
          :hovering="hovering === string"
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
  background-color: v-bind(backgroundColor);
}

.container {
  display: flex;
  height: var(--cell-height);
  /* border: 1px solid red; */
  justify-content: center;
  align-items: center;
  cursor: text;
}

.container.collapse {
  container-type: size;
}

.square {
  width: 95%;
  max-width: calc(var(--cell-height) / 2);
  aspect-ratio: 1;
  background-color: blue;
  display: none;
}

@container (aspect-ratio < 0.8) {
  .square {
    display: block;
  }
  .input {
    display: none;
  }
}

@container (aspect-ratio < 0.2) {
  .square {
    width: 100%;
  }
}

@container (aspect-ratio < 0.1) {
  .square {
    display: none;
  }
}
</style>
