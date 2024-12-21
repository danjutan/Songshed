<script setup lang="ts">
import NoteView from "./NoteView.vue";
import { defaultFrameColor } from "~/composables/colors";

const props = withDefaults(
  defineProps<{
    tuning?: Midi[];
    frets?: number;
    colors?: NoteColors;
    // stack?: NoteSpot[];
  }>(),
  {
    frets: 24,
    colors: () => defaultColors,
    tuning: () => defaultTuning,
    stack: () => defaultTuning.map((midi, string) => ({ midi, string, position: 0 })),
  },
);

const emit = defineEmits<{
  // noteChange: [spot: NoteSpot];
}>();

const cellRatio = 15 / 25; // height / width
const cellWidth = 50;
const cellHeight = cellWidth * cellRatio;
const noteRadius = cellWidth / 4;

const totalHeight = computed(() => cellHeight * (props.tuning.length + 1));
const totalWidth = computed(() => cellWidth * (props.frets + 1));

const viewBox = computed(() => `0 0 ${totalWidth.value} ${totalHeight.value}`);

const nextMidiClamp = (midi: number) => {
  const nextMidi = midi + 1;
  if (validMidi(nextMidi)) return nextMidi;
  return 127;
};

const rows: Midi[][] = props.tuning.map((startNote) =>
  range(startNote - 1, startNote + props.frets - 1).map(nextMidiClamp),
);

const rowLinesY = rows.map((_, y) => cellHeight / 2 + y * cellHeight);

const fretLabels = ["Open", ...range(props.frets)];

function noteToggle(selected: boolean, string: number, midi: Midi) {}

/* let data: NoteData | undefined = props.stack[string].data;
  if (selected) {
    data = { midi };
  } else if (data?.midi === props.tuning[string]) {
    data = undefined;
  } else {
    data = { midi: props.tuning[string] };
  }
  emit("noteChange", { ...props.stack[string], data }); */
</script>

<template>
  <svg :viewBox>
    <line
      v-for="i in frets - 1"
      :key="i"
      class="fret-line"
      :stroke="defaultFrameColor"
      :x1="(i + 1) * cellWidth"
      :x2="(i + 1) * cellWidth"
      :y1="rowLinesY[0]"
      :y2="rowLinesY[rowLinesY.length - 1]"
    />

    <text
      v-for="(label, i) in fretLabels"
      :key="i"
      text-anchor="middle"
      :x="i * cellWidth + cellWidth / 2"
      :y="rowLinesY[rowLinesY.length - 1] + 25"
      :fill="defaultFrameColor"
      font-family="sans-serif"
      font-size="8pt"
    >
      {{ label }}
    </text>

    <template v-for="(row, yi) in rows" :key="yi">
      <line
        class="string"
        :stroke="defaultFrameColor"
        :x1="cellWidth"
        :x2="totalWidth"
        :y1="rowLinesY[yi]"
        :y2="rowLinesY[yi]"
      />

      <NoteView
        v-for="(midi, xi) in row"
        :key="xi"
        :color="defaultColors[getChroma(midi)]"
        :selected="/*stack[yi].data?.midi === midi*/ false"
        :frame-color="defaultFrameColor"
        :midi
        :note-radius
        :cx="cellWidth / 2 + xi * cellWidth"
        :cy="rowLinesY[yi]"
        @toggle="(selected) => noteToggle(selected, yi, midi)"
      />
    </template>

    <line
      :stroke="defaultFrameColor"
      stroke-width="5"
      filter="brightness(50%)"
      :x1="cellWidth"
      :x2="cellWidth"
      :y1="rowLinesY[0] - 0.5"
      :y2="rowLinesY[rowLinesY.length - 1] + 0.5"
    />
  </svg>
</template>

<style></style>
