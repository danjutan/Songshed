<script lang="ts" setup>
import type { ChordNote, NoteStack } from "~/model/data";
import type { Midi } from "~/theory/notes";
import ChordDiagram from "./ChordDiagram.vue";

interface Props {
  voicings: NoteStack<ChordNote>[];
  tuning: Midi[];
}

const props = defineProps<Props>();
const model = defineModel<number>({ required: true });

const containerRef = ref<HTMLElement | null>(null);
const itemRefs = ref<HTMLElement[]>([]);
let observer: IntersectionObserver | null = null;

// Drag-to-scroll state
const isDragging = ref(false);
let dragStartY = 0;
let scrollStartY = 0;

function onMouseDown(e: MouseEvent) {
  const container = containerRef.value;
  if (!container) return;

  isDragging.value = true;
  dragStartY = e.clientY;
  scrollStartY = container.scrollTop;
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const container = containerRef.value;
  if (!container) return;

  const deltaY = dragStartY - e.clientY;
  container.scrollTop = scrollStartY + deltaY;
}

function onMouseUp() {
  if (!isDragging.value) return;

  const container = containerRef.value;
  if (container) {
    container.style.scrollSnapType = "";
    container.style.cursor = "";
  }
  isDragging.value = false;
}

function setDefaultSelection() {
  if (model.value === undefined && props.voicings.length > 0) {
    model.value = 0;
  }
}

function scrollToSelected() {
  const container = containerRef.value;
  if (!container) return;
  const target = itemRefs.value[model.value];
  if (target) {
    target.scrollIntoView({ block: "center" });
  }
}

onBeforeUpdate(() => {
  itemRefs.value = [];
});

onMounted(async () => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  await nextTick();
  setDefaultSelection();

  const container = containerRef.value;
  if (!container) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = (entry.target as HTMLElement).dataset.index;
        if (index !== undefined) {
          model.value = parseInt(index, 10);
        }
      });
    },
    {
      root: container,
      rootMargin: "-45% 0px -55% 0px",
      threshold: 0,
    },
  );

  const currentObserver = observer;
  if (currentObserver) {
    itemRefs.value.forEach((item) => currentObserver.observe(item));
  }
  scrollToSelected();
});

watch(
  () => props.voicings,
  async () => {
    await nextTick();
    // If current selection is out of bounds, reset to first item
    if (model.value >= props.voicings.length) {
      model.value = 0;
    }
    scrollToSelected();
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div
    ref="containerRef"
    class="scroll-container"
    :class="{ dragging: isDragging }"
    @mousedown="onMouseDown"
  >
    <div
      v-for="(voicing, index) in voicings"
      :key="index"
      ref="itemRefs"
      class="scroll-item"
      :class="{ selected: model === index }"
      :data-index="index"
    >
      <ChordDiagram :notes="voicing" :tuning="tuning" :interactive="false" />
    </div>
  </div>
</template>

<style scoped>
.scroll-container {
  --item-height: 60px;
  --item-gap: 6px;
  --visible-items: 2.5;
  width: 80px;
  height: calc(
    (var(--item-height) * var(--visible-items)) +
      (var(--item-gap) * (var(--visible-items) - 1))
  );
  display: flex;
  flex-direction: column;
  row-gap: var(--item-gap);
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: none;
  border-radius: 6px;
  border: 1px solid var(--p-border-color);
  background: var(--tab-background-color);
  padding-block: calc(var(--item-height) / 2);
  padding-inline: 4px;
  scrollbar-width: none;
  cursor: grab;

  &.dragging {
    cursor: grabbing;
    scroll-snap-type: none;
  }
}

.scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.scroll-item {
  flex: 0 0 var(--item-height);
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  user-select: none;
  opacity: 0.4;
  transition: opacity 0.15s ease-in-out;
  width: 100%;
}

.scroll-item :deep(.container) {
  width: 100%;
  transform: none;
}

.scroll-item :deep(.chart-svg) {
  transform: none;
}

.scroll-item.selected {
  opacity: 1;
}
</style>
