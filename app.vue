<script setup lang="ts">
import { Spacing, type FilledSpot, type NoteData, type NoteSpot } from './components/tabs/data';

const note1 = { string: 0, position: 0, data: {midi: toMidi("E4")} }
const note2 = { string: 1, position: Spacing.Quarter, data: {midi: toMidi("B3")} }
const notes = ref<FilledSpot[]>([note1, note2]);
// const showDivisions = ref(false);
</script>
<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <TabsTabBar v-model="notes"></TabsTabBar>
  <!-- <TabsTabBar v-model="another"></TabsTabBar> -->
  <Fretboard width="50%"/>
</template>
<style scoped>
/* div {
  width: 50%;
} */
</style>