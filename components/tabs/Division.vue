<!-- eslint-disable vue/html-closing-bracket-newline -->
<script lang="ts" setup>
import { type NoteSpot, SpacingsDescending } from "./data";
import type { DivisionData } from "./TabBar.vue";

const props = withDefaults(defineProps<{
  data: DivisionData
  frets: number
  tuning: Midi[]
}>(), {
});

const numStrings = computed(() => props.tuning.length);
const column = computed((() => props.data.notchPosition + 1));

const emit = defineEmits<{
  noteChange: [note: NoteSpot]
}>();

const sortedSubstacks = computed(() => props.data.substacks?.toSorted((a, b) => a.notchPosition - b.notchPosition) || []);
const relativePositions = computed(() => sortedSubstacks.value.map(substack => substack.notchPosition - props.data.notchPosition));
const subunit = computed(() => SpacingsDescending.find(spacing => relativePositions.value?.every(relative => relative % spacing === 0)) || 1);
const numColumns = computed(() => (1 - subunit.value) / subunit.value);
console.log(numColumns.value);
const colPositions = relativePositions.value.map(pos => pos / subunit.value);

const debugColor = computed(() => `rgb(${props.data.notchPosition % 2 * 255} 150 ${(props.data.notchPosition + 1) % 2 * 255})`);
</script>

<template>
  <div class="division"
       @click="console.log(data)">
    <div class="stack">
      <TabsNoteInput v-for="(noteSpot) in props.data.stack"
                     :key="noteSpot.string"
                     :data="noteSpot.data"
                     :tuning="props.tuning[noteSpot.string]"
                     :frets="props.frets"
                     @data-change="emit('noteChange', { ...noteSpot, data: $event })"
      />
    </div>
    <div class="substack-grid">
      <TabsStrings />
      <div v-for="(substack, i) in sortedSubstacks"
           :key="substack.notchPosition"
           class="substack"
           :style="{ gridColumn: colPositions[i] }">
        <!-- <template v-if="expanded">
            <TabsNoteInput v-for="noteSpot in substack.stack"
                           :key="noteSpot.string"
                           :data="noteSpot.data"
                           :background-color="expanded ? 'white' : 'transparent'"
                           :tuning="props.tuning[noteSpot.string]"
                           :frets="props.frets"
                           @data-change="emit('noteChange', { ...noteSpot, data: $event })"
            />
          </template> -->
        <!-- <template v-else> -->
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
        <!-- </template> -->
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
  /* border-top: 2px solid v-bind(debugColor); */
  display: flex;
}

.stack {
  grid-column: 1 / 1;
  /* border: 1px solid green; */
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
  width: 100%;
  /* height: calc(var(--min-division-width) / 2 * v-bind(numStrings)); */
  /* grid-template-columns: repeat(v-bind(numColumns), calc(var(--min-division-width) / 2 / v-bind(numColumns))) 1fr; */
  grid-template-columns: repeat(v-bind(numColumns), 1fr);
  grid-template-rows: repeat(v-bind(numStrings), calc(var(--min-division-width) / 2));
}
</style>
