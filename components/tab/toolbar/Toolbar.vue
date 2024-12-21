<script lang="ts" setup>
import type { TabStore } from "~/model/stores";
import { SettingsInjectionKey, type Settings } from "../state/settings-state";

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  save: [id: string];
}>();

const beatsPerBar = defineModel<number>("beatsPerBar");

const beatSize = defineModel<Spacing>("beatSize");

const beatSizeNumbers = [1, 2, 4, 8, 16, 32, 64, 128];
const spacingValues = Object.values(Spacing).filter(Number) as Spacing[];

const beatSizeNumber = computed(() => {
  if (!beatSize.value) return undefined;
  return beatSizeNumbers[spacingValues.indexOf(beatSize.value)];
});

function onBeatSizeSelect(event: Event) {
  const number = +(event.target as HTMLSelectElement).value;
  beatSize.value = spacingValues[beatSizeNumbers.indexOf(number)];
}

const settings = inject(SettingsInjectionKey) as Settings;

const saveId = ref(props.id);
</script>

<template>
  <div class="toolbar">
    Time:
    <div class="signature">
      <input v-model="beatsPerBar" type="number" />
      <div />
      <select @input="onBeatSizeSelect">
        <option
          v-for="number in beatSizeNumbers"
          :key="number"
          :value="number"
          :selected="number === beatSizeNumber"
        >
          {{ number }}
        </option>
      </select>
    </div>
    Bars per line:
    <input v-model="settings.barsPerLine" type="number" />
    Subdivisions:
    <input v-model="settings.subdivisions" type="number" />
    <label for="collapse-subdivisions">Collapse subdivisions</label>
    <input
      id="collapse-subdivisions"
      v-model="settings.collapseSubdivisions"
      type="checkbox"
    />

    <label for="collapse-empty">Collapse empty</label>
    <input
      id="collapse-empty"
      v-model="settings.collapseEmpty"
      type="checkbox"
    />
    <label for="collapse-all">Collapse all</label>
    <input id="collapse-all" v-model="settings.collapseAll" type="checkbox" />
    <input v-model="saveId" type="text" />
    <button @click="$emit('save', saveId)">Save</button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

input[type="number"] {
  width: 30px;
}

.signature {
  display: flex;
  flex-direction: column;
  width: 44px;

  & input {
    width: 36px;
    /* width: 100%; */
  }
  & div {
    background-color: black;
    height: 4px;
  }
  & select {
    width: min-content;
  }
}
</style>
