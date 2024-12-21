<script setup lang="ts">
import { Spacing, type FilledSpot, createNote } from "./components/tab/data";
import TabBar from "./components/tab/bar/TabBar.vue";

const notes = ref<FilledSpot[]>([
  createNote(0, 0, "B4"),
  createNote(Spacing.Quarter * 3, 0, "B4"),
  createNote(Spacing.Quarter * 4 - Spacing.Sixteenth, 0, "B4"),

  createNote(Spacing.Quarter * 2, 0, "C5"),

  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth, 1, "G5"),
  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 2, 4, "B3"),
  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 4, "C4"),
  createNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 5, "F3"),

  createNote(Spacing.Quarter * 2 + Spacing.Sixteenth, 5, "F2"),
]);
// const showDivisions = ref(false);
</script>

<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <div class="flex">
    <TabBar v-model="notes"
            :notches="8"
    />
    <TabBar v-model="notes" />
    <TabBar v-model="notes"
            :notches="32"
    />
    <TabBar v-model="notes"
            :notches="64"
    />
  </div>
  <Fretboard width="50%" />
</template>

<style>
.bar {
  width: 50%;
}
</style>
