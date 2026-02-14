<script lang="ts" setup>
import { useDragScroll } from "~/components/editor/chords/use-drag-scroll";
interface Props {
  items: string[];
  name: string;
}

const props = defineProps<Props>();
const model = defineModel<string | undefined>({ required: true });

const containerRef = useTemplateRef<HTMLElement>("containerRef");
const itemRefs = useTemplateRef<HTMLElement[]>("itemRefs");
const placeholderRef = useTemplateRef<HTMLElement>("placeholderRef");
let observer: IntersectionObserver | null = null;

const { isDragging, onMouseDown } = useDragScroll(containerRef);

function setupObserver() {
  const container = containerRef.value;
  if (!container) return;

  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const value = (entry.target as HTMLElement).dataset.value;
        // if (value === placeholderToken) {
        //   model.value = null;
        //   return;
        // }
        model.value = value;
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
    if (placeholderRef.value) {
      currentObserver.observe(placeholderRef.value);
    }
  }
}

function scrollToSelected() {
  const container = containerRef.value;
  if (!container) return;
  const target = itemRefs.value?.find(
    (item) => item.dataset.value === model.value,
  );
  if (target) {
    target.scrollIntoView({ inline: "center", block: "nearest" });
  } else if (model.value === undefined && placeholderRef.value) {
    placeholderRef.value.scrollIntoView({ inline: "center", block: "nearest" });
  }
}

onMounted(async () => {
  await nextTick();
  setupObserver();

  // Defer scroll until after layout is complete to handle sibling components
  // that may render conditionally and cause layout shifts
  requestAnimationFrame(() => {
    scrollToSelected();
  });
});

watch(
  () => props.items,
  async () => {
    await nextTick();
    // If current selection is not in new items, reset to first item
    if (model.value && !props.items.includes(model.value)) {
      model.value = props.items[0] ?? "";
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
    <label
      v-if="$slots.placeholder"
      ref="placeholderRef"
      class="scroll-item placeholder"
      :aria-selected="model === undefined"
    >
      <slot name="placeholder" />
      <input type="radio" :name="name" :value="undefined" />
    </label>
    <label
      v-for="item in items"
      :key="item"
      ref="itemRefs"
      class="scroll-item"
      :class="{
        selected: model === item,
      }"
      :data-value="item"
      :aria-selected="model === item"
    >
      <span class="label">{{ item }}</span>
      <input v-model="model" type="radio" :name="name" :value="item" />
    </label>
  </div>
</template>

<style scoped>
.scroll-container {
  --item-width: 35px;
  --item-gap: 6px;

  width: 100%;
  height: fit-content;
  /* min-height: 32px; */

  display: flex;
  flex-direction: row;
  column-gap: var(--item-gap);

  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: none;

  padding-inline: calc(50% - var(--item-width) / 2);
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 32px;
  color: var(--p-text-color);
  border-radius: 4px;
  scroll-snap-align: center;
  user-select: none;
}

.scroll-item.selected {
  color: var(--p-primary-color);
  font-weight: 600;
}

.scroll-item input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.scroll-item.placeholder {
  font-size: 10px;
  font-style: italic;
  color: var(--p-text-color);
  font-weight: normal;
}
</style>
