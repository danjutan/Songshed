<script setup lang="ts">
import { Spacing, type FilledSpot, createNote } from './components/tabs/data';

const notes = ref<FilledSpot[]>([
  createNote(0,0,"B4"), 
  createNote(Spacing.Quarter * 3, 0, "B4"),
  // createNote(4, Spacing.Quarter * 4, "B4"), //out of scope
  createNote(Spacing.Quarter, 0, "B4"), 
  createNote(Spacing.Quarter + Spacing.Sixteenth, 3, "B4"),
  createNote(Spacing.Quarter + Spacing.Eighth, 2, "B4"),
  createNote(Spacing.Quarter + Spacing.Eighth + Spacing.Sixteenth, 3, "B4"),
  createNote(Spacing.Quarter * 2, 0, "B4"),
  createNote(Spacing.Quarter * 2 + Spacing.ThirtySecond, 0, "B4"),
]);
// const showDivisions = ref(false);
</script>
<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <div class="flex">
    <TabsTabBar v-model="notes"/>
    <TabsTabBar v-model="notes"/>
  </div>
  <Fretboard width="50%"/>
</template>
<style scoped>
/* div {
  width: 50%;
} */
</style>