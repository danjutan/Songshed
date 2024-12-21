<script lang="ts" setup>
import { Spacing, type NoteSpot, SpacingsDescending } from './data';
import type { DivisionData } from './TabBar.vue';
import Expander from './Expander.vue';

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
    <Expander v-if="sortedSubstacks.length">
      <div class="substack-grid">
        <div v-for="(substack) in sortedSubstacks" :key="substack.notchPosition" class="substack">
          <TabsNoteInput 
            v-for="(noteSpot) in substack.stack" 
            :key="noteSpot.string"
            :data="noteSpot.data" 
            :tuning="props.tuning[noteSpot.string]" :frets="props.frets"
            @data-change="emit('noteChange', { ...noteSpot, data: $event })" />
        </div>
      </div>
    </Expander>
  </div>
</template>

<style scoped>
.substack-grid {
  display: grid;
  grid-auto-flow: column;
}

.division {
  min-width: calc(var(--min-division-width) * 0.75);
  /* overflow: hidden; */
  grid-row: 1 / span v-bind(numStrings);
  grid-column: v-bind(column) / span 1;
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
  border-top: 2px solid v-bind(debugColor);
}

.stack {
  grid-column: 1 / 1;
  /* border: 1px solid green; */
}

.substack {
  opacity: 0.5;
  border-top: blue;
}

.stack, .substack {
  display: flex;
  flex-direction: column;
}

</style>