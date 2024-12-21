<script lang="ts" setup>
import type { SpacerData } from './TabBar.vue';

const props = defineProps<{
  data: SpacerData
  strings: number
}>();

const notchStart = computed(() => props.data.notchStart + 1);
const notches = computed(() => props.data.notches);
</script>

<template>
  <div/>
</template>

<style scoped>
div {
  grid-row: 1 / span v-bind(strings);
  grid-column: v-bind(notchStart) / span v-bind(notches);
  background-color: gray;
  opacity: 0.2;
  width: 100%;
  height: 100%;
}

</style>