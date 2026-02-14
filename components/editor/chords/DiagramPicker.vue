<script lang="ts" setup>
import type { ChordNote, NoteStack } from "~/model/data";
import type { Midi } from "~/theory/notes";
import ChordDiagram from "~/components/editor/chords/ChordDiagram.vue";
import { useDragScroll } from "~/components/editor/chords/use-drag-scroll";

interface Props {
  voicings: NoteStack<ChordNote>[];
  tuning: Midi[];
}

const props = defineProps<Props>();
const model = defineModel<number>({ required: true });

const containerRef = useTemplateRef<HTMLElement>("containerRef");
const itemRefs = useTemplateRef<HTMLElement[]>("itemRefs");
let observer: IntersectionObserver | null = null;

const { isDragging, onMouseDown } = useDragScroll(containerRef);

function setDefaultSelection() {
  if (model.value === undefined && props.voicings.length > 0) {
    model.value = 0;
  }
}

function setupObserver() {
  const container = containerRef.value;
  if (!container) return;

  observer?.disconnect();
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
      rootMargin: "0px -45% 0px -55%",
      threshold: 0,
    },
  );

  const currentObserver = observer;
  if (currentObserver) {
    itemRefs.value?.forEach((item) => currentObserver.observe(item));
  }
}

function scrollToSelected() {
  const container = containerRef.value;
  if (!container) return;
  const target = itemRefs.value?.[model.value];
  if (target) {
    target.scrollIntoView({ inline: "center", block: "nearest" });
  }
}

onMounted(async () => {
  await nextTick();
  setDefaultSelection();
  setupObserver();
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
    setupObserver();
    scrollToSelected();
  },
);

onBeforeUnmount(() => {
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
  --item-width: 100px;
  --item-gap: 6px;

  width: 100%;

  display: flex;
  flex-direction: row;
  column-gap: var(--item-gap);

  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: none;

  padding-inline: calc(50% - var(--item-width) / 2);
  padding-block: 4px;
  border-radius: 6px;
  border: 1px solid var(--p-border-color);
  background: var(--tab-background-color);
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
  flex: 0 0 var(--item-width);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  user-select: none;
  opacity: 0.4;
  transition: opacity 0.15s ease-in-out;
}

.scroll-item :deep(.container) {
  height: 100%;
  width: auto;
  transform: none;
}

.scroll-item :deep(.chart-svg) {
  transform: none;
}

.scroll-item.selected {
  opacity: 1;
}
</style>
