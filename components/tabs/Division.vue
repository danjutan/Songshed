<script lang="ts" setup>
import { type NoteSpot } from "./data";
import type { DivisionData } from "./TabBar.vue";

const props = withDefaults(defineProps<{
  data: DivisionData
  subdivisions?: number
  frets: number
  tuning: Midi[]
}>(), {
  subdivisions: 4,
});

console.log(props.subdivisions);
const numStrings = computed(() => props.tuning.length);
const column = computed((() => props.data.notchPosition + 1));

const emit = defineEmits<{
  noteChange: [note: NoteSpot]
}>();

const sortedSubstacks = computed(() => props.data.substacks?.toSorted((a, b) => a.notchPosition - b.notchPosition) || []);
const relativePositions = computed(() => sortedSubstacks.value.map(substack => substack.notchPosition - props.data.notchPosition));
// const subunit = computed(() => SpacingsDescending.find(spacing => relativePositions.value?.every(relative => relative % spacing === 0)) || 1);
const subunit = computed(() => 1 / props.subdivisions);
const colPositions = computed(() => relativePositions.value.map(pos => 1 + pos / subunit.value));

const debugColor = computed(() => `rgb(${props.data.notchPosition % 2 * 255} 150 ${(props.data.notchPosition + 1) % 2 * 255})`);
</script>

<template>
  <div class="division"
       @click="console.log({ subunit, subdivisions, colPositions })">
    <div class="stack">
      <TabsNoteInput v-for="(noteSpot) in props.data.stack"
                     :key="noteSpot.string"
                     :data="noteSpot.data"
                     :tuning="props.tuning[noteSpot.string]"
                     :frets="props.frets"
                     @data-change="emit('noteChange', { ...noteSpot, data: $event })"
      />
    </div>
    <!-- <TabsStrings /> -->
    <div v-for="(substack, i) in sortedSubstacks"
         :key="substack.notchPosition"
         class="substack"
         :style="{ gridColumn: colPositions[i] }"
         @click="console.log(substack.notchPosition)">
      <div v-for="noteSpot in substack.stack"
           :key="noteSpot.string"
           class="indicator">
        <div v-if="noteSpot.data"
             class="square"
             :style="{ backgroundColor: defaultColors[getChroma(noteSpot.data.midi)] }"
        />
        <div class="input">
          <TabsNoteInput :data="noteSpot.data"
                         :tuning="props.tuning[noteSpot.string]"
                         :frets="props.frets"
                         @data-change="emit('noteChange', { ...noteSpot, data: $event })"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.division {
  /* min-width: calc(var(--min-division-width) * 0.75); */
  /* For scrollbar height */
  /* height: calc(var(--min-division-width) / 2 * v-bind(numStrings) + 20px); */
  grid-row: 1 / span v-bind(numStrings);
  grid-column: v-bind(column) / span 1;

  display: grid;
  grid-template-columns: calc(var(--min-division-width) / 2) repeat(calc(v-bind(subdivisions) - 1), 1fr);
  grid-template-rows: repeat(v-bind(numStrings), calc(var(--min-division-width) / 2));
  /* grid-template-columns: repeat(v-bind(numColumns), min(calc(var(--min-division-width / 2)), 1fr)); */
  /* grid-template-columns: repeat(v-bind(numColumns), calc(var(--min-division-width) / 2 / v-bind(numColumns))) 1fr; */
  /* border-top: 2px solid v-bind(debugColor); */
}

.stack {
  min-width: calc(var(--min-division-width) / 2);
  /* border: 1px solid v-bind(debugColor); */
}

.stack,
.substack {
  display: flex;
  flex-direction: column;
}

.substack {
  grid-row: 1 / -1;
}

.indicator {
  display: flex;
  height: calc(var(--min-division-width) / 2);
  /* border: 1px solid red; */
  justify-content: flex-start;
  align-items: center;
  container-type: size;
}

.square {
  width: 75%;
  max-width: calc(var(--min-division-width) / 4);
  aspect-ratio: 1;
  background-color: blue;
}

@container (aspect-ratio < 0.2) or (aspect-ratio > 1) {
  .square {
    display: none;
  }

}

@container (aspect-ratio < 1) {
  .indicator .input {
    display: none;
  }
}

@container (aspect-ratio > 1) {
  .indicator .input {
    display: block;
  }
}

.substack-grid {
  display: grid;
  flex-grow: 1;
  /* height: calc(var(--min-division-width) / 2 * v-bind(numStrings)); */

}
</style>
