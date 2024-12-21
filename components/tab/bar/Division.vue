<script lang="ts" setup>
import { type NoteSpot } from "../data";
import type { DivisionData } from "./TabBar.vue";
import Drape from "./toolbar/Drape.vue";

const props = withDefaults(
  defineProps<{
    data: DivisionData
    subdivisions?: number
    frets: number
    tuning: Midi[]
    debug?: boolean
  }>(),
  {
    subdivisions: 4,
  },
);

const numStrings = computed(() => props.tuning.length);

const emit = defineEmits<{
  noteChange: [note: NoteSpot]
}>();

const sortedSubstacks = computed(
  () =>
    props.data.substacks?.toSorted(
      (a, b) => a.notchPosition - b.notchPosition,
    ) || [],
);

const emptySubstackPositions = computed(() => {
  const notchPositions = [];
  const filled = new Set(sortedSubstacks.value.map(({ notchPosition }) => notchPosition));
  for (let i = 0; i < props.subdivisions - 1; i++) {
    if (!filled.has(i)) {
      notchPositions.push(i);
    }
  }
  return notchPositions;
});

const numFilledSubstacks = computed(() => sortedSubstacks.value.length);
const numSubstacks = computed(
  () => numFilledSubstacks.value && props.subdivisions - 1,
);
const relativePositions = computed(() =>
  sortedSubstacks.value.map(
    substack => substack.notchPosition - props.data.notchPosition,
  ),
);
// const subunit = computed(() => SpacingsDescending.find(spacing => relativePositions.value?.every(relative => relative % spacing === 0)) || 1);
const subunit = computed(() => 1 / props.subdivisions);
const colPositions = computed(() =>
  relativePositions.value.map(pos => 1 + pos / subunit.value),
);

const firstColWidth = computed(() =>
  sortedSubstacks.value.length ? "var(--note-font-size)" : "1fr",
);

const substacksExpanded = ref(false);
const substackMinWidth = computed(() =>
  substacksExpanded.value ? "var(--cell-height)" : "1px",
);

// Next task: all draping goes in toolbar
</script>

<template>
  <div
    class="division"
    @click="debug && console.log({ subunit, subdivisions, colPositions })">
    <div class="stack">
      <TabBarNoteInput
        v-for="noteSpot in props.data.stack"
        :key="noteSpot.string"
        :collapse="numFilledSubstacks == 0"
        :data="noteSpot.data"
        :tuning="props.tuning[noteSpot.string]"
        :frets="props.frets"
        @data-change="emit('noteChange', { ...noteSpot, data: $event })"
      />
    </div>

    <!-- <div v-for="i in emptySubstackPositions"
         :key="i"
         class="substack"
         :style="{ gridColumn: i + 1 }">
    >
    <TabBarNoteInput
      v-for="string in tuning"

  </div> -->

    <div
      v-for="(substack, i) in sortedSubstacks"
      :key="substack.notchPosition"
      class="substack"
      :style="{ gridColumn: colPositions[i] }">
      <div
        v-for="noteSpot in substack.stack"
        :key="noteSpot.string"
        class="indicator">
        <div
          v-if="noteSpot.data"
          class="square"
          :style="{
            backgroundColor: defaultColors[getChroma(noteSpot.data.midi)],
          }"
        />
        <div class="input">
          <TabBarNoteInput
            :data="noteSpot.data"
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
  display: grid;
  grid-template-columns: v-bind(firstColWidth) repeat(
      v-bind(numSubstacks),
      minmax(v-bind(substackMinWidth), 1fr)
    );
  grid-template-rows: repeat(v-bind(numStrings), var(--cell-height));
}

.stack,
.substack {
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
}

.substack-bg {
  grid-row: 1 / -1;
  grid-column: 2 / -1;
  background-color: var(--substack-bg);
}

.indicator {
  display: flex;
  height: var(--cell-height);
  /* border: 1px solid red; */
  justify-content: flex-start;
  align-items: center;
  container-type: size;
}

.square {
  width: 75%;
  max-width: calc(var(--cell-height) / 2);
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
}
</style>
