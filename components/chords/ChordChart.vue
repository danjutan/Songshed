<script setup lang="ts">
type Fingering = {
  [string: number]: { fret: number; finger: number }; //string is 0-indexed
};

const props = withDefaults(
  defineProps<{
    strings?: number;
    notes: Fingering;
  }>(),
  {
    strings: 6,
  },
);

const cellWidth = 24; // relative to a border width of 1
const cellRatio = 4 / 3; // height / width
const cellHeight = cellWidth * cellRatio;
const topEndHeight = cellHeight / 4;
const noteRadius = cellWidth / 3;

const frets = computed(() =>
  Object.values(props.notes)
    .map(({ fret }) => fret)
    .toSorted(),
);

const lastFret = computed(() => frets.value.at(-1) ?? 0);
const firstFret = computed(() => frets.value[0] ?? 0);

const fretStart = computed(() => (lastFret.value <= 4 ? 1 : firstFret.value));

const numFrets = computed(() => Math.max(4, lastFret.value - fretStart.value + 1));

const windowOffset = ref(0);
function incrementWindowOffset() {
  windowOffset.value++;
}
function decrementWindowOffset() {
  if (windowStart.value - 1 >= 1) windowOffset.value--;
}

const windowStart = computed(() => fretStart.value + windowOffset.value);
const windowEnd = computed(() => windowStart.value + numFrets.value - 1);

// const fretLabelWidth = computed(() => (windowStart.value === 0 ? 0 : cellWidth));
const gridStartX = computed(() => cellWidth);
const gridStartY = computed(() => (fretStart.value === 1 ? cellHeight + topEndHeight : cellHeight));
const gridEndX = computed(() => gridStartX.value + (props.strings - 1) * cellWidth);
const gridEndY = computed(() => gridStartY.value + numFrets.value * cellHeight);

const totalWidth = computed(() => gridEndX.value + cellWidth / 2);
const totalHeight = computed(() => cellHeight * (numFrets.value + 1) + gridStartY.value);

const viewBox = computed(() => `0 0 ${totalWidth.value} ${totalHeight.value}`);

// const fingerLabels = computed(() => new Array({length: numFrets}, i =>

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = target.value;
  if (value.trim() == "") {
    return;
  }
  const num = parseInt(value);
  if (Number.isInteger(num) && num >= 1 && num < 99) {
    windowOffset.value = num - fretStart.value;
    return;
  }
  target.value = `${windowStart.value}`;
}

function onInputBlur(e: Event) {
  const target = e.target as HTMLInputElement;
  target.value = `${windowStart.value}`;
}

function onInputClick(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
</script>

<template>
  <svg :viewBox>
    <rect
      v-if="windowStart === 1"
      :y="cellHeight"
      :height="topEndHeight"
      :x="gridStartX - 0.5"
      :width="gridEndX - gridStartX + 1"
      :fill="'black'"
    />

    <line
      v-for="(_, i) in strings"
      :x1="gridStartX + i * cellWidth"
      :x2="gridStartX + i * cellWidth"
      :y1="gridStartY"
      :y2="gridEndY"
      :stroke="'black'"
    />

    <line
      v-for="n in numFrets"
      :x1="gridStartX"
      :x2="gridEndX"
      :y1="gridStartY + n * cellHeight - 0.5"
      :y2="gridStartY + n * cellHeight - 0.5"
      :stroke="'black'"
    />

    <template v-for="(_, x) in strings">
      <template v-for="(f, y) in numFrets">
        <template v-if="notes[strings - x - 1]?.fret !== f + windowStart - 1">
          <rect
            :x="gridStartX + x * cellWidth - cellWidth / 2"
            :y="gridStartY + y * cellHeight"
            :width="cellWidth"
            :height="cellHeight"
            :fill="'transparent'"
          />
          <circle
            :cx="gridStartX + x * cellWidth"
            :cy="gridStartY + y * cellHeight + cellHeight / 2"
            :r="noteRadius"
          />
        </template>
      </template>
    </template>

    <template v-for="[string, { fret, finger }] in Object.entries(notes)">
      <circle
        v-if="fret >= windowStart && fret <= windowEnd"
        class="selected"
        :cx="gridStartX + (strings - +string - 1) * cellWidth"
        :cy="gridStartY + (fret - windowStart) * cellHeight + cellHeight / 2"
        :r="noteRadius"
      />
    </template>

    <template v-if="windowStart !== 1">
      <text
        v-for="(n, i) in numFrets"
        text-anchor="middle"
        :x="cellWidth / 2 - 1"
        :y="gridStartY + n * cellHeight - cellWidth / 2"
        fill="gray"
        font-family="sans-serif"
        :font-size="cellWidth / 2"
      >
        {{ windowStart + i }}
      </text>
    </template>

    <text
      class="arrow"
      text-anchor="middle"
      :x="cellWidth / 2"
      :y="gridStartY - cellHeight / 3 - 1"
      :transform="`rotate(-90, ${cellWidth * (3 / 4) - 1} ${gridStartY - cellHeight / 3 - 1})`"
      font-family="sans-serif"
      :font-size="cellHeight / 2"
      :fill="'transparent'"
      @click="decrementWindowOffset"
    >
      ⮕
    </text>

    <text
      class="arrow"
      text-anchor="middle"
      :x="cellWidth / 2"
      :y="gridEndY + cellWidth"
      :transform="`rotate(90, ${cellWidth * (3 / 4) - 1} ${gridEndY + cellWidth / 2})`"
      font-family="sans-serif"
      :font-size="cellHeight / 2"
      :fill="'transparent'"
      @click="incrementWindowOffset"
    >
      ⮕
    </text>
    <foreignObject :x="0" :y="gridStartY + 6" :width="100" :height="cellHeight">
      <input
        type="text"
        :value="windowStart"
        inputmode="numeric"
        @input="onInput"
        @blur="onInputBlur"
        @click="onInputClick"
      />
    </foreignObject>
  </svg>
</template>

<style scoped>
svg {
  /* border: 1px solid black; */
  user-select: none;
}

svg:hover input {
  display: inline-block;
}

svg:hover .arrow:not(:hover) {
  fill: gray;
}

.arrow:hover {
  fill: black;
  cursor: pointer;
}
circle:not(.selected) {
  fill: transparent;
}
rect:hover + circle,
circle:hover {
  fill: black;
}

input {
  display: none;
  width: 14px;
  font-size: 12px;
  text-align: center;
}
</style>
