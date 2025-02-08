<script lang="ts" setup>
import type {
  AnnotationStore,
  GuitarStack,
  GuitarStore,
  NotePosition,
} from "~/model/stores";
import type { Bar } from "../providers/state/provide-bar-management";
import GuitarBar from "./guitar/GuitarBar.vue";
import type { GuitarNote } from "~/model/data";
import { injectSubUnit } from "../providers/provide-subunit";
import { provideTabBarBounds } from "./provide-bar-bounds";
import { injectStackResizeObserver } from "../providers/events/provide-resize-observer";
import AnnotationsContainer from "../annotations/AnnotationsContainer.vue";
import NewRowButton from "../annotations/NewRowButton.vue";

const props = defineProps<{
  annotationStore: AnnotationStore;
  bar: Bar;
  guitarStore: GuitarStore;
  flexGrow?: number;
  highlight?: "delete" | false;
}>();

const { tablineStarts } = injectStackResizeObserver();
provideTabBarBounds(props.bar, tablineStarts);

const firstInLine = computed(() =>
  tablineStarts.value.includes(props.bar.start),
);
</script>

<template>
  <div
    class="tab-bar"
    :class="{ firstInLine }"
    :style="{ flex: flexGrow ? `${flexGrow} 0 0px` : undefined }"
  >
    <NewRowButton
      v-if="firstInLine"
      class="new-row-button"
      @click="annotationStore.createNextRow()"
    />
    <AnnotationsContainer class="annotations" :annotation-store />
    <GuitarBar
      class="guitar"
      :stack-data="bar.stacks"
      :tuning="guitarStore.tuning"
      :frets="guitarStore.frets"
      :num-strings="guitarStore.strings"
      :tie-store="guitarStore.ties"
      :highlight
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
  /* flex: v-bind(flexGrow) 0 0px; */
  position: relative;
}

.new-row-button {
  grid-column: 1;
  grid-row: 1;
  /* To avoid reflowing and looping the ResizeObserver */
  position: absolute;
  top: 1px;
}

.tab-bar.firstInLine {
  grid-template-columns: var(--cell-height) auto;
  & .guitar,
  & .annotations {
    grid-column: 2;
  }
}
</style>
