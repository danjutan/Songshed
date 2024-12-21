<script lang="ts" setup>
import type {  NoteSpot } from './data';
import type { DivisionData } from './TabBar.vue';

const props = withDefaults(defineProps<{
  data: DivisionData,
  frets: number,
  tuning: Midi[],
}>(), {
});

const numStrings = computed(() => props.tuning.length);
const column = computed((() => props.data.notchPosition + 1));

const emit = defineEmits<{
  noteChange: [note: NoteSpot],
}>()


</script>

<template>
  <div class="division">
    <div class="stack">
      <TabsNoteInput v-for="(noteSpot, i) in props.data.stack" 
        :data="noteSpot.data" :tuning="props.tuning[i]"
        :frets="props.frets" 
        @dataChange="emit('noteChange', {...noteSpot, data: $event})" />
    </div>
  </div>
</template>

<style scoped>
.division {
  border: 1px dashed black;
  display: flex;
  grid-row: 1 / span v-bind(numStrings);
  grid-column: v-bind(column) / 1;
  overflow: hidden;
}

.stack {
  border-right: 1px solid red;
  display: flex;
  flex-direction: column;
}
</style>