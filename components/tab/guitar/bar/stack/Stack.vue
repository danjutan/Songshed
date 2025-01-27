<script lang="ts" setup>
import type { GuitarNote, NoteStack } from "~/model/data";
import NoteContainer from "./NoteContainer.vue";
import { injectStackResizeObserver } from "~/components/tab/providers/events/provide-resize-observer";
import { useIsCollapsed } from "~/components/tab/hooks/use-collapsed";

const props = withDefaults(
  defineProps<{
    notes: Array<GuitarNote | undefined>;
    position: number;
    frets: number;
    onBeat: boolean;
    tuning: Midi[];
  }>(),
  {},
);

const emit = defineEmits<{
  noteDelete: [string: number];
  noteChange: [string: number, note: GuitarNote];
}>();

const resizeState = injectStackResizeObserver();

const stackRef = useTemplateRef<HTMLDivElement>("stack");

onMounted(() => {
  resizeState.registerStackRef(props.position, stackRef.value!);
});

watch(props.notes, () => {
  console.log("notes changed", props.position, props.notes);
});

// onUnmounted(() => {
//   console.log("stack unmounted", props.position);
// });

onBeforeUpdate(() => {
  console.log("updated stack");
});

const isCollapsed = useIsCollapsed(
  props.notes.filter(Boolean).length,
  props.onBeat,
);
</script>

<template>
  <div ref="stack" class="stack">
    <NoteContainer
      v-for="(note, string) in notes"
      :key="string"
      class="note-container"
      :note="note"
      :note-position="{ string, position }"
      :tuning="tuning[string]"
      :frets="frets"
      :collapsed="isCollapsed"
      @click="console.log(position)"
      @note-delete="emit('noteDelete', string)"
      @note-change="
        (updated: GuitarNote) => emit('noteChange', string, updated)
      "
    />
  </div>
</template>

<style scoped>
.stack {
  grid-row: 1 / -1;
  display: grid;
  grid-template-rows: subgrid;
}

.note-container:last-child {
  padding-bottom: var(--bottom-note-padding);
}
</style>
