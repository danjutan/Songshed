<script lang="ts" setup>
import type { GuitarStack, GuitarStore, NotePosition } from "~/model/stores";
import type { Bar } from "../providers/state/provide-bar-management";
import GuitarBar from "./guitar/GuitarBar.vue";
import type { GuitarNote } from "~/model/data";
import { injectSubUnit } from "../providers/provide-subunit";
import { provideTabBarBounds } from "./provide-bar-bounds";
import { injectStackResizeObserver } from "../providers/events/provide-resize-observer";

const props = defineProps<{
  bar: Bar;
  guitarStore: GuitarStore;
  flexGrow?: number;
}>();

const { tablineStarts } = injectStackResizeObserver();
provideTabBarBounds(props.bar, tablineStarts);
</script>

<template>
  <div class="tab-bar">
    <!-- annotations go here -->
    <GuitarBar
      class="guitar"
      :stack-data="bar.stacks"
      :tuning="guitarStore.tuning"
      :frets="guitarStore.frets"
      :num-strings="guitarStore.strings"
      :tie-store="guitarStore.ties"
      @note-delete="(pos) => guitarStore.deleteNote(pos)"
      @note-change="(pos, note) => guitarStore.setNote(pos, note)"
    >
      <template #divider>
        <slot name="divider" />
      </template>
    </GuitarBar>
  </div>
</template>

<style scoped>
.tab-bar {
  display: grid;
  /* min-width: min-content; */
  flex: v-bind(flexGrow) 0 0px;
  /* grid-template-columns: repeat(1, auto); */
}

/* .guitar {
  grid-column: 2 / 2;
} */
</style>
