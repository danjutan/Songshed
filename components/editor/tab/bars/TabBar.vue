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
} from "~/components/editor/tab/providers/state/provide-bar-management";
import GuitarBar from "~/components/editor/tab/bars/guitar/GuitarBar.vue";
import { provideTabBarBounds } from "~/components/editor/tab/bars/providers/provide-bar-bounds";
import { injectStackResizeObserver } from "~/components/editor/tab/providers/events/provide-resize-observer";
import AnnotationsContainer from "~/components/editor/tab/annotations/AnnotationsContainer.vue";
import { injectBarHoverState } from "~/components/editor/tab/providers/state/provide-bar-hover-state";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getInsertBarDropData, isBarDragData } from "~/components/editor/tab/hooks/dnd/dnd-types";

export type BarHighlightType =
  | "might-delete"
  | "might-move"
  | "moving"
  | "move-target";

const props = defineProps<{
  annotationStore: AnnotationStore;
  bar: Bar;
  guitarStore: GuitarStore;
  highlight?: BarHighlightType | false;
}>();

const resizeObserver = injectStackResizeObserver();

const overlayReference = useTemplateRef("overlayReference");

provideTabBarBounds(
  resizeObserver,
  injectBarManagement(),
  computed(() => props.bar),
  computed(() => overlayReference.value?.$el),
);

const { setHoveredBarStart, clearHoveredBarStart } = injectBarHoverState();

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
    @mouseover="setHoveredBarStart(bar.start)"
    @mouseleave="clearHoveredBarStart"
  >
    <AnnotationsContainer class="annotations" :annotation-store />
    <GuitarBar
      ref="overlayReference"
      class="guitar"
      :stack-data="bar.stacks"
      :tuning="guitarStore.tuning"
      :frets="guitarStore.frets"
      :tie-store="guitarStore.ties"
      @note-delete="(pos) => guitarStore.deleteNote(pos)"
      @note-change="(pos, note) => guitarStore.setNote(pos, note)"
    >
      <template v-if="$slots.widget" #widget>
        <slot name="widget" />
      </template>
    </GuitarBar>
    <div v-if="highlight" class="highlight" :class="highlight" />
  </div>
</template>

<style scoped>
.tab-bar {
  max-width: max-content;
  display: grid;
  position: relative;
}

.highlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
  opacity: var(--select-alpha);
  z-index: var(--bar-highlight-z-index);

  &.might-delete {
    background-color: var(--delete-color);
  }
  &.might-move {
    background-color: var(--might-move-color);
  }
  &.moving {
    background-color: var(--moving-color);
  }
  &.move-target {
    background-color: var(--move-target-color);
  }
}
</style>
