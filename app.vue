<script setup lang="ts">
import { createDivision, type Division } from './components/tabs/data';


const divnum = ref([createDivision(1, 1, [{note: 66}, { note: 60 }, {note: 60}], [,,,{ note: 55}]), createDivision(3,1, [,,{note: 56}])]);

// const showDivisions = ref(false);
</script>
<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <input type="number" min="2" max="4"/>
  <TabsTabBar v-model="divnum"></TabsTabBar>
  <!-- <TabsTabBar v-model="another"></TabsTabBar> -->
  <Fretboard width="50%"/>
</template>
<style scoped>
/* div {
  width: 50%;
} */
</style>./components/tabs/data