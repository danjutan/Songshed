<script setup lang="ts">
import type { ChordNote, NoteStack } from "~/model/data";
import type {
  InputNumberBlurEvent,
  InputNumberInputEvent,
} from "primevue/inputnumber";
import { X, ChevronDown, ChevronUp } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    strings?: number;
    notes: NoteStack<ChordNote>;
    tuning: Midi[];
  }>(),
  {
    strings: 6,
  },
);

const emit = defineEmits<{
  updateString: [string: number, data: ChordNote];
  muteString: [string: number];
}>();

const fingering = computed(() => {
  const fingering: {
    [string: number]: ChordNote & { fret: number };
  } = {};

  for (const [string, note] of props.notes.entries()) {
    const fret = note.note - props.tuning[string];
    fingering[string] = { ...note, fret };
  }
  return fingering;
});

const cellWidth = 48; // relative to a border width of 1
const cellRatio = 4 / 3; // height / width
const cellHeight = cellWidth * cellRatio;
const topEndHeight = cellHeight / 4;
const noteRadius = cellWidth / 3;

const frets = computed(() =>
  Object.values(fingering.value)
    .map(({ fret }) => fret)
    .sort(),
);

const lastFret = computed(() => frets.value.at(-1) ?? 0);
const firstFret = computed(() => frets.value[0] ?? 0);

const fretStart = computed(() => (lastFret.value <= 4 ? 1 : firstFret.value));

const numFrets = computed(() =>
  fretStart.value ? Math.max(4, lastFret.value - fretStart.value + 1) : 4,
);

const windowStart = ref(fretStart.value);
const windowEnd = computed(() => windowStart.value + numFrets.value - 1);

watch(numFrets, () => {
  windowStart.value = fretStart.value;
});

function incrementWindow() {
  windowStart.value++;
}

function decrementWindow() {
  if (windowStart.value - 1 >= 1) windowStart.value--;
}

// const fretLabelWidth = computed(() => (windowStart.value === 0 ? 0 : cellWidth));
const gridStartX = computed(() => cellWidth);
const gridStartY = computed(() => 0);
const gridEndX = computed(
  () => gridStartX.value + (props.strings - 1) * cellWidth,
);
const gridEndY = computed(() => gridStartY.value + numFrets.value * cellHeight);

const totalWidth = computed(() => gridEndX.value);
const totalHeight = computed(
  () => cellHeight * numFrets.value /*+ 0.5*/ + gridStartY.value,
);

const fretFontSize = computed(() => cellWidth / 2);
const fretFontSizePx = computed(() => `${fretFontSize.value}px`);

const viewBox = computed(() => `0 0 ${totalWidth.value} ${totalHeight.value}`);

// const fingerLabels = computed(() => new Array({length: numFrets}, i =>
function setFret(string: number, fret: number | false) {
  const note = props.notes.get(string);
  if (fret === false) {
    emit("muteString", string);
    return;
  }
  emit("updateString", string, {
    ...note,
    note: (props.tuning[string] + fret) as Midi,
  });
}

function onInput(e: InputNumberInputEvent) {
  if (e.value === null) {
    return;
  }
  if (typeof e.value === "number") {
    if (e.value < 1) {
      windowStart.value = 1;
    } else if (e.value < 30) {
      windowStart.value = e.value;
    }
  }
  const target = e.originalEvent.target as HTMLInputElement;
  target.value = `${windowStart.value}`;
}

function onInputBlur(e: InputNumberBlurEvent) {
  if (!e.value) {
    windowStart.value = 1;
  }
  const target = e.originalEvent.target as HTMLInputElement;
  target.value = `${windowStart.value}`;
}

function onInputClick(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
</script>

<template>
  <div class="container">
    <svg class="chart-svg" :viewBox>
      <rect
        v-if="windowStart === 1"
        :y="gridStartY - topEndHeight"
        :height="topEndHeight"
        :x="gridStartX - 0.5"
        :width="gridEndX - gridStartX + 1"
        fill="var(--p-content-color)"
      />

      <line
        v-for="(_, i) in strings"
        :x1="gridStartX + i * cellWidth"
        :x2="gridStartX + i * cellWidth"
        :y1="gridStartY"
        :y2="gridEndY"
        stroke="var(--p-content-color)"
      />

      <line
        v-for="n in numFrets"
        :x1="gridStartX"
        :x2="gridEndX"
        :y1="gridStartY + n * cellHeight - 0.5"
        :y2="gridStartY + n * cellHeight - 0.5"
        stroke="var(--p-content-color)"
      />

      <template v-for="(_, x) in strings">
        <template v-for="(f, y) in numFrets">
          <g
            v-if="fingering[strings - x - 1]?.fret !== f + windowStart - 1"
            class="selectable-group"
            @click="setFret(strings - x - 1, f + windowStart - 1)"
          >
            <circle
              class="selectable"
              :cx="gridStartX + x * cellWidth"
              :cy="gridStartY + y * cellHeight + cellHeight / 2"
              :r="noteRadius"
            />
            <rect
              :x="gridStartX + x * cellWidth - cellWidth / 2"
              :y="gridStartY + y * cellHeight"
              :width="cellWidth"
              :height="cellHeight"
              fill="transparent"
            />
          </g>
        </template>
      </template>

      <template v-for="(_, string) in strings">
        <template v-if="fingering[string]">
          <g
            v-if="fingering[string].fret === 0"
            class="open-group"
            @click="setFret(string, false)"
          >
            <circle
              class="open"
              :cx="gridStartX + (strings - string - 1) * cellWidth"
              :cy="gridStartY - cellHeight * 0.65"
              :r="noteRadius"
              fill="transparent"
              stroke="var(--p-content-color)"
            />
            <rect
              :x="gridStartX + (strings - string - 1.5) * cellWidth"
              :y="gridStartY - cellHeight"
              :width="cellWidth"
              :height="cellHeight"
              fill="transparent"
            />
          </g>
          <template
            v-else-if="
              fingering[string].fret >= windowStart &&
              fingering[string].fret <= windowEnd
            "
          >
            <!--TODO: replace with NoteView-->
            <circle
              class="selected"
              :cx="gridStartX + (strings - string - 1) * cellWidth"
              :cy="
                gridStartY +
                (fingering[string].fret - windowStart) * cellHeight +
                cellHeight / 2
              "
              :r="noteRadius"
              fill="var(--p-content-color)"
              @click="setFret(string, false)"
            />
            <g class="selected-open-group" @click="setFret(string, 0)">
              <circle
                class="open"
                :cx="gridStartX + (strings - string - 1) * cellWidth"
                :cy="gridStartY - cellHeight * 0.65"
                :r="noteRadius"
                fill="transparent"
              />
              <rect
                :x="gridStartX + (strings - string - 1.5) * cellWidth"
                :y="gridStartY - cellHeight"
                :width="cellWidth"
                :height="cellHeight"
                fill="transparent"
              />
            </g>
          </template>
        </template>
        <g v-else class="muted-group" @click="setFret(string, 0)">
          <X
            :size="(cellWidth * 2) / 3"
            :x="gridStartX + (strings - string - 1.33) * cellWidth"
            :y="gridStartY - cellHeight * 0.85"
          />
          <rect
            :x="gridStartX + (strings - string - 1.5) * cellWidth"
            :y="gridStartY - cellHeight"
            :width="cellWidth"
            :height="cellHeight"
            fill="transparent"
          />
        </g>
      </template>

      <template v-if="windowStart !== 1">
        <text
          v-for="(n, i) in numFrets"
          class="fret-label"
          text-anchor="middle"
          :x="cellWidth * 0.48"
          :y="gridStartY + n * cellHeight - cellWidth / 2"
          font-family="sans-serif"
          :font-size="fretFontSize"
        >
          {{ windowStart + i }}
        </text>
      </template>

      <!-- <foreignObject
        v-if="windowStart > 1"
        :x="-2"
        :y="gridStartY - cellHeight / 2"
        :width="cellWidth"
        :height="cellHeight"
      >
        <Button text @click="decrementWindow">
          <template #icon>
            <ChevronUp class="arrow" :size="fretFontSize * 1.5" />
          </template>
        </Button>
      </foreignObject>

      <rect
        class="bottom-edge"
        :x="gridStartX - cellWidth"
        :y="gridEndY"
        :width="gridEndX - gridStartX"
        :height="cellHeight"
        fill="transparent"
        @click="incrementWindow"
      />

      <foreignObject
        :x="-2"
        :y="gridEndY - cellHeight / 3 + 1"
        :width="cellWidth"
        :height="cellHeight"
      >
        <Button :style="{ position: 'fixed' }" text @click="incrementWindow">
          <template #icon>
            <ChevronDown class="arrow" :size="fretFontSize * 1.5" />
          </template>
        </Button>
      </foreignObject>

      <foreignObject
        :x="-7"
        :y="gridStartY + cellHeight / 8 + 1"
        :width="cellWidth"
        :height="cellHeight"
      >
        <InputNumber
          :model-value="windowStart"
          class="fret-input"
          pt:pcInputText:class="fret-input-text"
          @input="onInput"
          @blur="onInputBlur"
          @click="onInputClick"
        />
      </foreignObject> -->
    </svg>
    <div class="window-controls">
      <div class="window-decrement-container">
        <Button class="window-button decrement" text @click="decrementWindow">
          <template #icon>
            <ChevronUp class="arrow" />
          </template>
        </Button>
        <InputNumber
          :model-value="windowStart"
          class="fret-input"
          pt:pcInputText:class="fret-input-text"
          @input="onInput"
          @blur="onInputBlur"
          @click="onInputClick"
        />
      </div>
      <Button class="window-button increment" text @click="incrementWindow">
        <template #icon>
          <ChevronDown class="arrow" />
        </template>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.container {
  overflow: visible;
  padding-bottom: var(--cell-height);
  margin-bottom: var(--cell-height);
  position: relative;
}

.chart-svg {
  width: 100%;
  transform: translateY(var(--cell-height));
  user-select: none;
  overflow: visible;
}

.window-controls {
  position: absolute;
  top: var(--cell-height);
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(v-bind(numFrets), 1fr);
  justify-items: center;
  height: calc(100% - var(--cell-height));
  width: calc(100% / v-bind(strings));
}

.chart-svg:not(:hover) + div .fret-input {
  display: none;
}

.chart-svg:not(:hover) .arrow {
  fill: transparent;
}

.fret-label {
  fill: rgb(from var(--p-content-color) r g b / 0.7);
}

.window-button {
  width: var(--cell-height);
  height: var(--cell-height);
}

.window-button.increment {
  grid-row: -1;
  transform: translateY(calc(var(--cell-height) * 0.8));
}

.window-decrement-container {
  width: 100%;
  grid-row: 1;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  justify-items: center;
  align-items: center;
  /* transform: translateY(calc(var(--cell-height) * -0.8)); */

  & .window-button,
  & .fret-input {
    grid-row: 1;
    grid-column: 1;
  }

  & .window-button {
    transform: translateY(calc(var(--cell-height) * -0.8));
  }

  & .fret-input:deep(input) {
    width: var(--cell-height);
    height: var(--cell-height);
    transform: translateX(-1px) translateY(calc(var(--cell-height) * 0.2));
    padding-inline: 0px;
    text-align: center;
    font-family: sans-serif;
    font-size: calc(var(--note-font-size) * 0.8);
  }
}

.arrow {
  color: var(--p-content-color);
}

.arrow:hover,
.bottom-edge:hover + .arrow {
  opacity: 0.5;
}

.bottom-edge {
  cursor: pointer;
}

.selectable {
  fill: transparent;
}

.open-group:hover {
  opacity: 0.5;
}

.muted-group:hover {
  & svg {
    opacity: 0.5;
  }
}

.selected-open-group:hover .open {
  stroke: rgb(80, 80, 80);
}

.selectable-group:hover .selectable {
  fill: rgb(from var(--note-hover-color) r g b / 0.7);
  stroke: rgb(from var(--p-content-color) r g b / 0.25);
}
.selected:hover {
  /* fill: rgb(from var(--note-hover-color) r g b / 0.2);*/
  stroke-width: 6;
  stroke: rgb(from var(--p-content-color) r g b / 0.25);
}
.open-group rect,
.muted-group rect,
.selected-open-group rect,
.selectable-group rect,
.selected {
  cursor: pointer;
}
</style>
