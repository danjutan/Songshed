<script lang="ts" setup>
import { type BarStore, Spacing, type TabStore } from "./data";
import TabBar from "./bar/TabBar.vue";
import { ExpansionStateKey, createExpansionState } from "./providers/expansion-state";

// TODO: move to app
provide(ExpansionStateKey, createExpansionState());

const props = withDefaults(defineProps<{
  data: TabStore
  notches?: number
  subdivisions: number
  // The top part of a time signature
  beatsPerBar?: number
  // The bottom part of a time signature
  beatSize?: number
}>(), {
  notches: 2,
  subdivisions: 4,
  beatsPerBar: 4,
  beatSize: Spacing.Quarter,
});
const barSize = computed(() => props.beatsPerBar * props.beatSize);

const barsUntil = ref(props.data.lastPosition() ?? 0);

const bars = computed<BarStore[]>(() => {
  const barStores: BarStore[] = [];
  for (let i = 0; i <= barsUntil.value; i += barSize.value) {
    barStores.push(props.data.getBar(i, i + barSize.value));
  }
  /* for (i; i <= newBarUntil; i += barSize.value) {
    barStores.push(props
  } */
  return barStores;
});

function newBarClick() {
  barsUntil.value = Math.max((props.data.lastPosition() || 0), barsUntil.value + barSize.value);
}
</script>

<template>
  <div class="tab">
    <TabBar v-for="barStore in bars"
            :key="barStore.start"
            :data="barStore"
            :beats="barSize"
            :notches="notches * beatsPerBar"
            :subdivisions="subdivisions"
    />
    <div class="new-button"
         @click="newBarClick">
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
  --highlight-color: rgba(172, 206, 247, 0.4);
  --note-hover-color: rgba(172, 206, 247, 0.8);

}

.tab > .bar {
  border-right: 1px solid black;
  flex-grow: 1
}

.new-button {
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.new-button:hover {
  background-color: rgba(240, 240, 240);
}

.new-button span {
  color: rgba(100, 100, 100);
  font-size: 16px;
}
</style>
