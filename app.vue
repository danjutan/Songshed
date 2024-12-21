<script setup lang="ts">
import type { Division } from './components/tabs/types';


// const div1: Division[] = [[4,2], [4,4]]
// const div2: Division[] = [[2,1], [2,1], [4,4]]
// const div3: Division[] = [[1,0.5], [1, 0.5], [2,1], [4,4]]
const d = (...nums: number[]) => [...nums.map(n => [n, []] as Division)];
const divnum = ref(d(1/2,1/6,1/6,1/6,1/2,1/4,1/4,2));
const another = ref(d(1,1,1,1));

// const showDivisions = ref(false);
</script>
<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <input type="number"/>
  <TabsTabBar v-model="divnum"></TabsTabBar>
  <TabsTabBar :model-value="another"</TabsTabBar>
  <Fretboard width="50%"/>
</template>
<style scoped>
div {
  width: 50%;
}
</style>