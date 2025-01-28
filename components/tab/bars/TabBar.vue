<script lang="ts" setup>
import type { GuitarStore, NotePosition } from "~/model/stores";
import type { Bar } from "../providers/provide-bar-management";
import GuitarBar, { type GuitarBarProps } from "./guitar/GuitarBar.vue";
import type { GuitarNote } from "~/model/data";

const props = defineProps<{
  guitarStore: GuitarStore;
  guitarBarData: GuitarBarProps;
  flexGrow?: number;
}>();
</script>

<template>
  <div class="tab-bar">
    <slot name="divider" />
    <GuitarBar
      class="guitar"
      v-bind="guitarBarData"
      @note-delete="(pos) => guitarStore.deleteNote(pos)"
      @note-change="(pos, note) => guitarStore.setNote(pos, note)"
    />
  </div>
</template>

<style scoped>
.tab-bar {
  display: grid;
  /* min-width: min-content; */
  flex: v-bind(flexGrow) 0 0px;
  grid-template-columns: var(--divider-width) repeat(1, auto);
}

.guitar {
  grid-column: 2 / 2;
}

.divider {
  grid-row: 1;
  grid-column: 2 / -1;
}
</style>
