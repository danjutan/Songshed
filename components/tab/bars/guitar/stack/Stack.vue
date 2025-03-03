<script lang="ts" setup>
import type { GuitarNote, NoteStack } from "~/model/data";
import NoteContainer from "./NoteContainer.vue";
import { injectStackResizeObserver } from "~/components/tab/providers/events/provide-resize-observer";
import { useIsCollapsed } from "~/components/tab/hooks/use-collapsed";
import { injectBeatSize } from "~/components/tab/providers/provide-beatsize";
import { injectBarHoverState } from "../../../providers/state/provide-bar-hover-state";
import { injectTabBarBounds } from "../../provide-bar-bounds";
import { injectSelectionState } from "~/components/tab/providers/state/provide-selection-state";
import StringLine from "./StringLine.vue";

const props = withDefaults(
  defineProps<{
    notes: Array<GuitarNote | undefined>;
    position: number;
    frets: number;
    tuning: Midi[];
  }>(),
  {},
);

const emit = defineEmits<{
  noteDelete: [string: number];
  noteChange: [string: number, note: GuitarNote];
}>();

const resizeState = injectStackResizeObserver();
const beatSize = injectBeatSize();
const { hoveredBarStart } = injectBarHoverState();
const tabBarBounds = injectTabBarBounds();
const selectionState = injectSelectionState();

const stackRef = useTemplateRef<HTMLDivElement>("stack");

onMounted(() => {
  resizeState.registerStackRef(props.position, stackRef.value!);
});

// watch(
//   () => props.notes,
//   () => {
//     console.log("notes changed", props.position, props.notes);
//   },
// );

// onUnmounted(() => {
//   console.log("stack unmounted", props.position);
// });

// onBeforeUpdate(() => {
//   console.log("updated stack");
// });

const isBarHovered = computed(() => {
  return hoveredBarStart.value === tabBarBounds.start;
});

const barHasSelection = computed(() => {
  return selectionState.regions.some((region) => {
    const barStart = tabBarBounds.start;
    const barEnd = tabBarBounds.end;

    return (
      // Region is contains bar
      (region.minPosition <= barEnd && region.maxPosition >= barStart) ||
      // Region starts within bar
      (region.minPosition >= barStart && region.minPosition <= barEnd) ||
      // Region ends within bar
      (region.maxPosition >= barStart && region.maxPosition <= barEnd)
    );
  });
});

const showNoteContainers = computed(() => {
  return (
    props.notes.filter(Boolean).length > 0 ||
    isBarHovered.value ||
    barHasSelection.value
  );
});

const isCollapsed = useIsCollapsed(
  computed(() => props.notes),
  props.position % beatSize.value === 0,
);
</script>

<template>
  <div ref="stack" class="stack" :class="{ collapsed: isCollapsed }">
    <template v-if="showNoteContainers">
      <NoteContainer
        v-for="(note, string) in notes"
        :key="string"
        class="note-container"
        :note="note"
        :note-position="{ string, position }"
        :tuning="tuning[string]"
        :frets="frets"
        @click="console.log(position)"
        @note-delete="emit('noteDelete', string)"
        @note-change="
          (updated: GuitarNote) => emit('noteChange', string, updated)
        "
      />
    </template>
    <template v-else>
      <StringLine v-for="string in tuning.length" :key="string" />
    </template>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;
  min-width: var(--expanded-min-width);
}

.collapsed {
  min-width: var(--collapsed-min-width);
}
</style>
