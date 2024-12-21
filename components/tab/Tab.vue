<script lang="ts" setup>
import { type BarStore, Spacing, type TabStore } from "./data";
import TabBar from "./bar/TabBar.vue";
import { VisualizationStateKey, createVisualizationState } from "./providers";

provide(VisualizationStateKey, createVisualizationState());

const props = withDefaults(defineProps<{
  data: TabStore
  resolution?: number
  // The top part of a time signature
  beatsPerBar?: number
  // The bottom part of a time signature
  beatSize?: number
}>(), {
  resolution: 4,
  beatsPerBar: 4,
  beatSize: Spacing.Quarter,
});
const barSize = computed(() => props.beatsPerBar * props.beatSize);

const bars = computed<BarStore[]>(() => {
  const barStores: BarStore[] = [];
  const lastPosition = props.data.lastPosition();
  console.log(lastPosition);
  for (let i = 0; i <= (props.data.lastPosition() ?? 0); i += barSize.value) {
    barStores.push(props.data.getBar(i, i + barSize.value));
  }
  return barStores;
});
</script>

<template>
  <div class="tab">
    <TabBar v-for="barStore in bars"
            :key="barStore.start"
            :data="barStore"
            :beats="barSize"
            :notches="resolution * beatsPerBar"
    />
    <div class="new-button">
      <span>+</span>
    </div>
  </div>
</template>

<style scoped>
.tab {
  display: flex;
  width: 100%;
  --cell-height: 23px;
  --note-font-size: calc(var(--cell-height) * 0.8);
  --substack-bg: rgba(255, 0, 0, 0.1);
  --string-width: 1px;
  --string-color: gray;
  --highlight-color: rgba(172, 206, 247, 0.6);
}

.tab > .bar {
  border-right: 1px solid black;
  flex-grow: 1;
}

.new-button {
  margin-top: calc(var(--cell-height) * 1.5);
  margin-bottom: calc(var(--cell-height) / 2);
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(150, 150, 150, 0.1);
}

.new-button span {
  color: gray;
  font-size: 16px;
}
</style>
