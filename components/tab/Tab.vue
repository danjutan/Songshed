<script lang="ts" setup>
import { type BarStore, Spacing, type TabStore } from "./data";
import TabBar from "./bar/TabBar.vue";

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
  for (let i = 0; i < (props.data.lastPosition() ?? 0); i += barSize.value) {
    barStores.push(props.data.getBar(i, i + barSize.value));
  }
  return barStores;
});
</script>

<template>
  <div class="tab">
    <TabBar v-for="barStore in bars"
            :data="barStore"
            :beats="barSize"
            :notches="resolution * beatsPerBar"
    />
  </div>
</template>

<style scoped>
.tab {
  display: flex;
  width: 100%;
}

.tab div {
  width: 50%;
}
</style>
