<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";

const props = defineProps<{
  data: ChordStore;
}>();
</script>

<template>
  <template v-for="(chord, i) of data.chords" :key="i">
    <ChordChart
      class="chart"
      :notes="chord.notes"
      :tuning="data.tuning"
      @update-string="(string, note) => chord.notes.set(string, note)"
      @mute-string="(string) => chord.notes.delete(string)"
    />
  </template>
</template>

<style>
.chart {
  width: 200px;
  /* border: 1px solid blue;
  &:hover {
    width: 180px;
  } */
}
</style>
