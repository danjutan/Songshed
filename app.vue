<script setup lang="ts">
import type { Division } from './components/tabs/data';
import { createEmptyDivision } from './components/tabs/data';


const divnum = ref([1/2,1/6,1/6,1/6,1/2,1/4,1/4,2].map(d => createEmptyDivision(d, 6)));

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
  width: 50%;
}
</style>./components/tabs/data