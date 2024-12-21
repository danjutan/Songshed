<script setup lang="ts">
import { Spacing, type FilledSpot, createNote } from './components/tabs/data';

const notes = ref<FilledSpot[]>([
  createNote(0,0,"E4"), 
  createNote(1, Spacing.Quarter, "B3"), 
  createNote(2, Spacing.Quarter * 2, "B4"),
  createNote(3, Spacing.Quarter * 3, "B4"),
  createNote(4, Spacing.Quarter * 4, "B4"),
]);
// const showDivisions = ref(false);
</script>
<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <TabsTabBar v-model="notes"/>
  <!-- <TabsTabBar v-model="another"></TabsTabBar> -->
  <Fretboard width="50%"/>
</template>
<style scoped>
/* div {
  width: 50%;
} */
</style>