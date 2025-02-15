<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";
import type { Chord } from "~/model/data";

const props = defineProps<{
  data: ChordStore;
}>();

function titleInput(e: Event, chord: Chord) {
  const value = (e.target as HTMLDivElement).innerText;
  chord.title = value;
}
</script>

<template>
  <div class="container">
    <div v-for="(chord, i) of data.chords" class="chord">
      <div class="title-row">
        <div class="left-filler" />
        <!--TODO: user PrimeVue's Inplace-->
        <div class="text" contenteditable @input="(e) => titleInput(e, chord)">
          {{ chord.title }}
        </div>
        <div class="delete" @click="data.deleteChord(i)">&Cross;</div>
      </div>
      <ChordChart
        class="chart"
        :notes="chord.notes"
        :tuning="data.tuning"
        @update-string="(string, note) => chord.notes.set(string, note)"
        @mute-string="(string) => chord.notes.delete(string)"
      />
    </div>
    <div class="add" @click="data.addChord()">
      <span>+</span>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
}

.chord {
  display: flex;
  flex-direction: column;
  align-items: center;
  &:hover {
    & .delete {
      opacity: 1;
    }
    /* & .chart {
      width: 200px;
    }
    & .title {
      font-size: 24px;
      width: 96px;
    } */
  }
}

.title-row {
  display: flex;
  width: 100%;
  justify-content: center;
}
.text {
  border-bottom: 1px solid var(--p-text-color);
  width: 50px;
  text-align: center;
  font-weight: bold;
}

.delete {
  opacity: 0;
  cursor: pointer;
  color: var(--p-red-600);
  &:hover {
    font-weight: bold;
  }
}

.left-filler {
  width: 24px;
}
.chart {
  width: 120px;
  /* border: 1px solid blue;
  &:hover {
    width: 180px;
  } */
}

.add {
  height: 100px;
  width: 20px;
  border-radius: 10px;
  font-size: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  /* TODO: get rid of this */
  &:hover {
    background: lightcoral;
    border-color: darkred;
    color: white;
    font-weight: bold;
  }
}
</style>
