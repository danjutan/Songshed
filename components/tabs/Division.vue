<script lang="ts" setup>
import { Spacing, type NoteSpot, SpacingsDescending } from './data';
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


const sortedSubstacks = computed(() => props.data.substacks?.sort((a, b) => a.notchPosition - b.notchPosition) || []);
const relativePositions = computed(() => sortedSubstacks.value.map(substack => substack.notchPosition - props.data.notchPosition));
const subunit = computed(() => SpacingsDescending.find(spacing => relativePositions.value?.every(relative => relative % spacing === 0)) || 1);
const columns = computed(() => 1 / subunit.value);
const colPositions = sortedSubstacks.value.map(substack => substack.notchPosition / subunit.value);

const debugColor = computed(() => `rgb(${props.data.notchPosition % 2 * 255} 150 ${(props.data.notchPosition + 1) % 2 * 255})`);

</script>

<template>
  <div class="division" @click="console.log(data)">
    <div class="stack">
      <TabsNoteInput 
        v-for="(noteSpot) in props.data.stack" 
        :key="noteSpot.string"
        :data="noteSpot.data" 
        :tuning="props.tuning[noteSpot.string]" :frets="props.frets"
        @data-change="emit('noteChange', { ...noteSpot, data: $event })" />
    </div>
    <div class="substack" v-for="(substack, i) in sortedSubstacks" :key="substack.notchPosition">
      <TabsNoteInput 
        v-for="(noteSpot) in substack.stack" 
        :key="noteSpot.string"
        :data="noteSpot.data" 
        :tuning="props.tuning[noteSpot.string]" :frets="props.frets"
        :style="{ gridColumn: colPositions[i] }"
        @data-change="emit('noteChange', { ...noteSpot, data: $event })" />
    </div>
  </div>
</template>

<style scoped>
.division {
  min-width: calc(var(--min-division-width) * 0.75);
  grid-row: 1 / span v-bind(numStrings);
  grid-column: v-bind(column) / span 1;
  overflow: auto;
  overflow-y: hidden;
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
  border-top: 2px solid v-bind(debugColor);
}

.stack {
  grid-column: 1 / 1;
}

.substack {
  border-top: blue;
}

.stack, .substack {
  display: flex;
  flex-direction: column;
}
</style>