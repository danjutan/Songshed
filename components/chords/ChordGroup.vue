<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";

const props = defineProps<{
  data: ChordStore;
}>();
</script>

<template>
  <div class="container">
    <template v-for="(chord, i) of data.chords" :key="i">
      <ChordChart
        class="chart"
        :notes="chord.notes"
        :tuning="data.tuning"
        @update-string="(string, note) => chord.notes.set(string, note)"
        @mute-string="(string) => chord.notes.delete(string)"
      />
    </template>
    <div class="add" @click="data.addChord()">
      <span>+</span>
    </div>
  </div>
</template>

<style>
.container {
  display: flex;
  align-items: center;
}
.chart {
  width: 200px;
  /* border: 1px solid blue;
  &:hover {
    width: 180px;
  } */
}

.add {
  height: 100px;
  width: 20px;
  border: 1px solid gray;
  border-radius: 10px;
  font-size: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    background: lightcoral;
    border-color: darkred;
    color: white;
    font-weight: bold;
  }
}
</style>
