<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";
import { Check, X, Plus, Grip } from "lucide-vue-next";

// TODO: all of the chord stuff should be independent of cellHeight

const props = defineProps<{
  data: ChordStore;
}>();

const mightDeleteChord = ref<number | undefined>(undefined);
const mightMoveChord = ref<number | undefined>(undefined);

const inplaceOpened = ref(false);
</script>

<template>
  <div class="container">
    <div v-if="data.chords.length === 0" class="empty-chords-label">
      Chords:
    </div>
    <div
      v-for="(chord, i) of data.chords"
      class="chord"
      :class="{ 'inplace-opened': inplaceOpened }"
    >
      <div class="title-row">
        <div class="left-filler" />
        <Inplace
          class="inplace"
          pt:display:class="inplace-display"
          pt:content:class="inplace-content"
          @open="inplaceOpened = true"
          @close="inplaceOpened = false"
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

        <div class="buttons-container">
          <Button
            class="delete icon-button"
            text
            @mouseenter="mightDeleteChord = i"
            @mouseleave="mightDeleteChord = undefined"
            @click="
              () => {
                mightDeleteChord = undefined;
                data.deleteChord(i);
              }
            "
          >
            <template #icon>
              <X :size="16" />
            </template>
          </Button>
          <Grip class="move-handle" :size="16" />
        </div>
      </div>
      <ChordChart
        class="chart"
        :notes="chord.notes"
        :tuning="data.tuning"
        :highlight="mightDeleteChord === i && 'might-delete'"
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
  gap: 10px;
}

.chord {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  &:hover:not(.inplace-opened) {
    & .buttons-container {
      opacity: 1;
    }
    /* & .chart {
      width: 200px;
    } */
  }
}

.empty-chords-label {
  font-size: var(--note-font-size);
  font-weight: bold;
}

.title-row {
  display: flex;
  margin-left: var(--cell-height);
  width: calc(100% - var(--cell-height));
  justify-content: space-between;
  align-items: center;
}

:deep(.inplace-display) {
  width: 96px;
  text-align: center;
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

.buttons-container {
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.delete {
  cursor: pointer;
  color: var(--p-red-600);
  &:hover {
    font-weight: bold;
  }
}

.move-handle {
  cursor: move;
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
