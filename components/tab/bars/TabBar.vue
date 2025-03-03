<script lang="ts" setup>
import type {
  AnnotationStore,
  GuitarStack,
  GuitarStore,
  NotePosition,
} from "~/model/stores";
import {
  injectBarManagement,
  type Bar,
} from "../providers/state/provide-bar-management";
import GuitarBar from "./guitar/GuitarBar.vue";
import type { GuitarNote } from "~/model/data";
import { provideTabBarBounds } from "./provide-bar-bounds";
import { injectStackResizeObserver } from "../providers/events/provide-resize-observer";
import AnnotationsContainer from "../annotations/AnnotationsContainer.vue";
import NewRowButton from "../annotations/NewRowButton.vue";
import { injectBarHoverState } from "../providers/state/provide-bar-hover-state";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
const props = defineProps<{
  annotationStore: AnnotationStore;
  bar: Bar;
  guitarStore: GuitarStore;
  flexGrow?: number;
  highlight?: "delete" | false;
}>();

const resizeObserver = injectStackResizeObserver();

const overlayReference = useTemplateRef("overlayReference");

provideTabBarBounds(
  props.bar,
  resizeObserver,
  injectBarManagement(),
  computed(() => overlayReference.value?.$el),
);

const { setHoveredBarStart, clearHoveredBarStart } = injectBarHoverState();

const firstInLine = computed(() =>
  resizeObserver.tablineStarts.includes(props.bar.start),
);

const tabBar = useTemplateRef<HTMLDivElement>("tabBar");

watchEffect((cleanup) => {
  if (!tabBar.value) {
    return;
  }
  cleanup(
    dropTargetForElements({
      element: tabBar.value,
      // Because mouseover doesn't seem to fire during drag
      onDropTargetChange: (dropTarget) => {
        setHoveredBarStart(props.bar.start);
      },
    }),
  );
});
</script>

<template>
  <div
    ref="tabBar"
    class="tab-bar"
    :class="{ firstInLine }"
    :style="{ flex: flexGrow ? `${flexGrow} 0 0px` : undefined }"
    @mouseover="setHoveredBarStart(bar.start)"
    @mouseleave="clearHoveredBarStart"
  >
    <NewRowButton
      v-if="firstInLine"
      class="new-row-button"
      @click="annotationStore.createNextRow()"
    />
    <AnnotationsContainer class="annotations" :annotation-store />
    <GuitarBar
      ref="overlayReference"
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
