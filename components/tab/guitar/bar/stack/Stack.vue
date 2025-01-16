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
    <NoteContainer
      v-for="(note, string) in noteSpots"
      :key="string"
      class="note-container"
      :note="note"
      :string="string"
      :position="position"
      :tuning="tuning[string]"
      :frets="frets"
      :collapse
      @note-delete="emit('noteDelete', string)"
      @note-change="(updated) => emit('noteChange', string, updated)"
    />
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;
}

.note-container:last-child {
  padding-bottom: var(--bottom-note-padding);
}
</style>
