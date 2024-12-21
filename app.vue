<script setup lang="ts">
import { Spacing, type FilledSpot, createNote } from './components/tabs/data';

const notes = ref<FilledSpot[]>([
  createNote(0,0,"B4"), 
  createNote(Spacing.Quarter * 3, 0, "B4"),
  createNote(Spacing.Quarter * 4 - Spacing.Sixteenth, 0, "B4"), 

  createNote(Spacing.Quarter * 2, 0, "C5"),

  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth, 0, "C5"),
  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 2, 4, "C5"),
  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 5, "C5"),

  createNote(Spacing.Quarter * 2 + Spacing.Sixteenth, 5, "B4"),
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