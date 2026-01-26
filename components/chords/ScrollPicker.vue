<script lang="ts" setup>
interface Props {
  items: string[];
  name: string;
}

const props = defineProps<Props>();
const model = defineModel<string>({ required: true });

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
  if (!model.value && props.items.length > 0) {
    model.value = props.items[0];
  }
}

function scrollToSelected() {
  const container = containerRef.value;
  if (!container) return;
  const target = itemRefs.value.find(
    (item) => item.dataset.value === model.value,
  );
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
        const value = (entry.target as HTMLElement).dataset.value;
        if (value !== undefined) {
          model.value = value;
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
  () => props.items,
  async () => {
    await nextTick();
    // If current selection is not in new items, reset to first item
    if (!props.items.includes(model.value)) {
      model.value = props.items[0] ?? "";
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
    <label
      v-for="item in items"
      :key="item"
      ref="itemRefs"
      class="scroll-item"
      :class="{ selected: model === item }"
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
  --item-height: 26px;
  --item-gap: 6px;
  --visible-items: 3;
  height: calc(
    (var(--item-height) * var(--visible-items)) +
      (var(--item-gap) * (var(--visible-items) - 1))
  );
  width: fit-content;
  min-width: 32px;
  display: flex;
  flex-direction: column;
  row-gap: var(--item-gap);
  /* align-items: center; */
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: none;
  border-radius: 6px;
  border: 1px solid var(--p-border-color);
  background: var(--tab-background-color);
  padding-block: calc(var(--item-height) * 2);
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
  font-size: 12px;
  line-height: var(--item-height);
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
</style>
