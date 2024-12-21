<script setup lang="ts">
import type { Division } from './components/tabs/data';
import { createEmptyDivision } from './components/tabs/data';


const divnum = ref([0.5, 0.5, 2, 1].map(d => createEmptyDivision(d, 6)));
// Create a grid with X divisions, where X = total / smallest
// Each division occupies Y columns, where Y = duration / smallest
// The minimum size of any column is min-width
// This setup keeps all divisions proportional to each other at all times
// If you break a division and the resulting divisions are smaller than smallest,
// the division you're breaking becomes its own TabBar, with expandAll turned on. You can toggle it
// ^ but this doesn't make sense... if I have [1,1,1,1] and they all have plenty of width, I don't need a toggleable division
// but how would we know if a division is too small? we'd need to know the width of the division is 
// we could try container queries...

divnum.value[0].notes[1].note = 70;

function buttonClick () {
  divnum.value[0].notes[2].note = 60;
}

const another = ref([1, 1, 1, 1].map(d => createEmptyDivision(d, 6)));


// const showDivisions = ref(false);
</script>
<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <button @click="buttonClick">hehe</button>
  <input type="number" min="2" max="4"/>
  <TabsTabBar v-model="divnum"></TabsTabBar>
  <TabsTabBar v-model="another"></TabsTabBar>
  <Fretboard width="50%"/>
</template>
<style scoped>
div {
  width: 100%;
}
</style>./components/tabs/data