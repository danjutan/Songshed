<script lang="ts" setup>
import TuningInput from "./TuningInput.vue";
import { Plus, Minus } from "lucide-vue-next";
const test = ref<Midi>(toMidi("E4"));

const tuning = defineModel<Midi[]>({ required: true });
const emit = defineEmits(["addTop", "addBottom", "removeTop", "removeBottom"]);

const updateNote = (index: number, newValue: Midi) => {
  const newTuning = [...tuning.value];
  newTuning[index] = newValue;
  tuning.value = newTuning;
};
</script>

<template>
  <div class="tuning-widget">
    <div class="input-container">
      <div class="buttons top">
        <Button
          v-show="tuning.length > 4"
          size="small"
          class="button"
          severity="contrast"
          @click="emit('removeTop')"
        >
          <template #icon>
            <Minus :size="16" />
          </template>
        </Button>
        <Button
          size="small"
          class="button"
          severity="contrast"
          @click="emit('addTop')"
        >
          <template #icon>
            <Plus :size="16" />
          </template>
        </Button>
      </div>
      <TuningInput
        v-for="(note, i) in tuning"
        :key="i"
        class="input"
        :model-value="note"
        :style="{ gridRow: i + 1 }"
        @update:model-value="(value) => updateNote(i, value)"
      />
      <div class="buttons bottom">
        <Button
          v-show="tuning.length > 4"
          size="small"
          class="button"
          severity="contrast"
          @click="emit('removeBottom')"
        >
          <template #icon>
            <Minus :size="16" />
          </template>
        </Button>
        <Button
          size="small"
          class="button"
          severity="contrast"
          @click="emit('addBottom')"
        >
          <template #icon>
            <Plus :size="16" />
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
  padding: 0px 10px;
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
    width: 44px;
  }
  & .display-container {
    opacity: 0;
  }
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 1px;
  height: var(--cell-height);
  z-index: var(--overlay-controls-z-index);
  --p-button-sm-icon-only-width: 22px;

  &.top {
    grid-row: 1;
    grid-column: 1;
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
  /* border-color: var(--p-button-outlined-secondary-border-color); */
}

.display {
  font-family: sans-serif;
  margin-top: 2px;
}
</style>
