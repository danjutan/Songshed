<script lang="ts" setup>
import { getSuffixesForChroma } from "~/theory/chords";

const suffixes = computed(() => getSuffixesForChroma(0));
const selectedSuffix = ref("");

const containerRef = ref<HTMLElement | null>(null);
const itemRefs = ref<HTMLElement[]>([]);
let observer: IntersectionObserver | null = null;

const displaySuffix = (suffix: string) => (suffix === "" ? "maj" : suffix);

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
  container.style.scrollSnapType = "none";
  container.style.cursor = "grabbing";
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
  if (!selectedSuffix.value && suffixes.value.length > 0) {
    selectedSuffix.value = suffixes.value[0];
  }
}

function scrollToSelected() {
  const container = containerRef.value;
  if (!container) return;
  const target = itemRefs.value.find(
    (item) => item.dataset.suffix === selectedSuffix.value,
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
        const suffix = (entry.target as HTMLElement).dataset.suffix;
        if (suffix !== undefined) {
          selectedSuffix.value = suffix;
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
  () => suffixes.value,
  async () => {
    await nextTick();
    setDefaultSelection();
    scrollToSelected();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div class="chord-select">
    <div ref="containerRef" class="scroll-container" @mousedown="onMouseDown">
      <label
        v-for="suffix in suffixes"
        :key="suffix"
        ref="itemRefs"
        class="scroll-item"
        :class="{ selected: selectedSuffix === suffix }"
        :data-suffix="suffix"
        :aria-selected="selectedSuffix === suffix"
      >
        <span class="label">{{ displaySuffix(suffix) }}</span>
        <input
          v-model="selectedSuffix"
          type="radio"
          name="chord-suffix"
          :value="suffix"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.chord-select {
  --item-height: 26px;
  --item-gap: 6px;
  --visible-items: 3;
  width: 100%;
  display: flex;
  justify-content: center;
}

.scroll-container {
  height: calc(
    (var(--item-height) * var(--visible-items)) +
      (var(--item-gap) * (var(--visible-items) - 1))
  );
  width: 64px;
  display: flex;
  flex-direction: column;
  row-gap: var(--item-gap);
  align-items: center;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: none;
  border-radius: 6px;
  border: 1px solid var(--p-border-color);
  background: var(--tab-background-color);
  padding-block: calc(var(--item-height) * 2);
  scrollbar-width: none;
  cursor: grab;
}

.scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.scroll-item {
  flex: 0 0 var(--item-height);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
