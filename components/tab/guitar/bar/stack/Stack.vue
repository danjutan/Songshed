<script lang="ts" setup>
import type { GuitarNote, NoteStack } from "~/model/data";
import NoteContainer from "./NoteContainer.vue";
import { injectStackResizeObserver } from "~/components/tab/providers/events/provide-resize-observer";

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

const resizeState = injectStackResizeObserver();

const stackRef = useTemplateRef<HTMLDivElement>("stack");
const noteSpots = computed(() => {
  const noteSpots = new Array<GuitarNote | undefined>(props.tuning.length);
  for (const [string, note] of props.notes.entries()) {
    noteSpots[string] = note;
  }
  return noteSpots;
});

onMounted(() => {
  resizeState.registerStackRef(props.position, stackRef.value);
});
</script>

<template>
  <div ref="stack" class="stack" :class="{ collapse }">
    <div class="pos-line" />
    <NoteContainer
      v-for="(note, string) in noteSpots"
      :key="string"
      class="note-container"
      :note="note"
      :string="string"
      :position="position"
      :tuning="tuning[string]"
      :frets="frets"
      @note-delete="emit('noteDelete', string)"
      @note-change="(updated) => emit('noteChange', string, updated)"
    />
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;

  &.collapse .note-container {
    container-type: size;
  }

  &:not(.collapse) {
    min-width: var(--cell-height);
    justify-self: center;
  }
}

.pos-line {
  grid-row: 1 / -1;
  grid-column: 1;
  width: 1px;
  background-color: lightgray;
  justify-self: center;
}
</style>
