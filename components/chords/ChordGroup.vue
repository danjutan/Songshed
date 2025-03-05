<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";
import type { Chord } from "~/model/data";
import { Check, X, Plus } from "lucide-vue-next";

const props = defineProps<{
  data: ChordStore;
}>();
</script>

<template>
  <div class="container">
    <div v-for="(chord, i) of data.chords" class="chord">
      <div class="title-row">
        <div class="left-filler" />
        <!--TODO: use PrimeVue's Inplace-->
        <Inplace
          class="inplace"
          pt:display:class="inplace-display"
          pt:content:class="inplace-content"
        >
          <template #display>
            {{ chord.title || "..." }}
          </template>
          <template #content="{ closeCallback }">
            <InputText v-model="chord.title" class="title-input" />
            <Button class="icon-button" text @click="closeCallback">
              <template #icon>
                <Check :size="16" color="var(--p-green-600)" />
              </template>
            </Button>
          </template>
        </Inplace>

        <Button class="delete icon-button" text @click="data.deleteChord(i)">
          <template #icon>
            <X :size="16" />
          </template>
        </Button>
      </div>
      <ChordChart
        class="chart"
        :notes="chord.notes"
        :tuning="data.tuning"
        @update-string="(string, note) => chord.notes.set(string, note)"
        @mute-string="(string) => chord.notes.delete(string)"
      />
      <div class="overlay" />
    </div>
    <Button class="add" severity="secondary" outlined @click="data.addChord()">
      <template #icon>
        <Plus :size="24" />
      </template>
    </Button>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
}

.chord {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 10px;
  &:hover {
    & .delete {
      opacity: 1;
    }
    /* & .chart {
      width: 200px;
    } */
  }
}

.overlay {
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.chord:has(.delete:hover) {
  .overlay {
    background: rgb(from var(--delete-color) r g b / var(--select-alpha));
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
}

:deep(.inplace-display) {
  padding: 6px;
}

:deep(.inplace-content) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-input {
  width: 80px;
  text-align: center;
  height: 32px;
  padding-inline: 2px;
}

.icon-button {
  width: 16px;
  height: 32px;
  padding: 0px;
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
  width: 150px;
  /* border: 1px solid blue;
  &:hover {
    width: 180px;
  } */
}

.add {
  width: none;
  padding: 2px;
}
</style>
