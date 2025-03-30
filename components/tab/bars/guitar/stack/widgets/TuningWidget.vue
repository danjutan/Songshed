<script lang="ts" setup>
import type { UpdateTuning } from "~/model/stores";
import TuningInput from "./TuningInput.vue";
import { Plus, Minus } from "lucide-vue-next";

const props = defineProps<{
  tuning: Midi[];
  updateTuning: UpdateTuning;
}>();

const emit = defineEmits([
  "updateNote",
  "addTop",
  "addBottom",
  "removeTop",
  "removeBottom",
]);

const updateNote = (index: number, newValue: Midi) => {
  emit("updateNote", index, newValue);
};
</script>

<template>
  <div class="tuning-widget">
    <div class="input-container">
      <div class="buttons top">
        <Button
          size="small"
          class="button"
          severity="contrast"
          @click="updateTuning.addTop()"
        >
          <template #icon>
            <Plus :size="16" />
          </template>
        </Button>
        <Button
          v-show="tuning.length > 4"
          size="small"
          class="button"
          severity="contrast"
          @click="updateTuning.removeTop()"
        >
          <template #icon>
            <Minus :size="16" />
          </template>
        </Button>
      </div>
      <TuningInput
        v-for="(note, i) in tuning"
        :key="i"
        class="input"
        :font-size="'calc(var(--note-font-size) * 0.8)'"
        :model-value="note"
        :style="{ gridRow: i + 1 }"
        @update:model-value="(value) => updateTuning.setTuningNote(i, value)"
      />
      <div class="buttons bottom">
        <Button
          size="small"
          class="button"
          severity="contrast"
          @click="updateTuning.addBottom()"
        >
          <template #icon>
            <Plus :size="16" />
          </template>
        </Button>
        <Button
          v-show="tuning.length > 4"
          size="small"
          class="button"
          severity="contrast"
          @click="updateTuning.removeBottom()"
        >
          <template #icon>
            <Minus :size="16" />
          </template>
        </Button>
      </div>
    </div>
    <div class="display-container">
      <div
        v-for="(note, i) in tuning"
        :key="i"
        class="display"
        :style="{ gridRow: i + 1 }"
      >
        {{ getNameAndOctave(note).name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.tuning-widget {
  grid-row: 1 / -1;
  display: grid;
  grid-template-rows: subgrid;
  padding-left: 10px;
  padding-right: 10px;
}

.input-container,
.display-container {
  grid-row: 1 / -1;
  display: grid;
  grid-template-rows: subgrid;
}

.input-container {
  opacity: 0;
  width: 0px;
  transition: all 0.15s ease-out;

  & .input {
    grid-column: 1;
  }
}

.display-container {
  transition: all 0.1s ease;
}

.tuning-widget:hover {
  & .input-container {
    opacity: 1;
    width: calc(var(--cell-height) * 2.4);
  }
  & .display-container {
    opacity: 0;
    /* TODO: explore transitioning to width: 0px, maybe using Vue transitions */
  }
}

.buttons {
  grid-column: 1;
  display: flex;
  justify-content: space-evenly;
  gap: 1px;
  height: var(--cell-height);
  z-index: var(--overlay-controls-z-index);
  /* --p-button-sm-icon-only-width: 22px; */

  &.top {
    grid-row: 1;
    transform: translateY(calc(-75% - 2px));
  }

  &.bottom {
    transform: translateY(calc(100%));
    grid-row: -1;

    & .button {
      margin-top: 2px;
    }
  }
}

.button {
  height: 75%;
  padding: 0px;
  --p-button-sm-icon-only-width: var(--note-font-size);
  /* border-color: var(--p-button-outlined-secondary-border-color); */
}

.display {
  font-family: sans-serif;
  font-size: var(--note-font-size);
  margin-top: 2px;
}
</style>
