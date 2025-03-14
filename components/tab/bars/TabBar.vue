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
import { provideTabBarBounds } from "./provide-bar-bounds";
import { injectStackResizeObserver } from "../providers/events/provide-resize-observer";
import AnnotationsContainer from "../annotations/AnnotationsContainer.vue";
import NewRowButton from "../annotations/NewRowButton.vue";
import { injectBarHoverState } from "../providers/state/provide-bar-hover-state";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getInsertBarDropData, isBarDragData } from "../hooks/dnd/dnd-types";

export type BarHighlightType =
  | "might-delete"
  | "might-move"
  | "moving"
  | "move-target";

const props = defineProps<{
  annotationStore: AnnotationStore;
  bar: Bar;
  guitarStore: GuitarStore;
  flexGrow?: number;
  highlight?: BarHighlightType | false;
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
      getData: () => getInsertBarDropData({ position: props.bar.start }),
      // Because mouseover doesn't seem to fire during drag
      onDropTargetChange: (args) => {
        setHoveredBarStart(props.bar.start);
        // if (isBarDragData(args.source.data)) {
        //   console.log("bar drag data", props.bar.start, args.source.data);
        // }
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
      <template v-if="$slots.widget" #widget>
        <slot name="widget" />
      </template>
    </GuitarBar>
  </div>
</template>

<style scoped>
.tab-bar {
  max-width: max-content;
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
