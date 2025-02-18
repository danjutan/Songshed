<script lang="ts" setup>
import type { Tie } from "~/model/stores";
import OverlayCoords from "~/components/tab/bars/OverlayCoords.vue";
import TieCurve from "./TieCurve.vue";
import TieSelect from "./TieSelect.vue";
import { injectEditingState } from "~/components/tab/providers/state/provide-editing-state";
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import { TieType } from "~/model/data";
import { injectTieAddState } from "~/components/tab/providers/state/provide-tie-add-state";
import { injectSpacingsState } from "~/components/tab/providers/provide-spacings";

const props = defineProps<{
  tie: Tie;
  showLabel?: boolean | "shift";
}>();

const { editingNote } = injectEditingState();
const { hoveredCell } = injectCellHoverEvents();
const { contextMenuHeight, cellHeight, dividerWidth } = injectSpacingsState();
const tieAddState = injectTieAddState();

const connected = computed(
  () => props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined,
);

const ascending = computed(
  () => !connected.value || props.tie.midiFrom! < props.tie.midiTo!,
);
const row = computed(() => props.tie.string + 1);

const slideRowStart = computed(() =>
  ascending.value ? row.value + -0.2 : row.value - 0.8,
);

const slideRowEnd = computed(() =>
  ascending.value ? row.value - 0.8 : row.value - 0.2,
);

const selectHovered = ref(false);

const selectActive = computed(() => {
  if (tieAddState.dragging.value) return false;
  if (selectHovered.value) return true;
  if (editingNote.value) {
    if (
      editingNote.value.string === props.tie.string &&
      [props.tie.from, props.tie.to].includes(editingNote.value.position)
    )
      return true;
  }
  if (hoveredCell.value) {
    const { row, position } = hoveredCell.value;
    if (
      row === props.tie.string &&
      props.tie.from < position &&
      props.tie.to > position
    ) {
      return true;
    }
  }

  return false;
});

watch(
  () => props.tie.type,
  () => {
    selectHovered.value = false;
  },
);

const startRowTop = computed(() => contextMenuHeight.value + cellHeight.value);

const hasTie = computed(() =>
  [TieType.Hammer, TieType.Tap, TieType.TieSlide].includes(props.tie.type),
);
const hasSlide = computed(() =>
  [TieType.Slide, TieType.TieSlide].includes(props.tie.type),
);

const tieCurve = useTemplateRef("tieCurve");
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to] }"
    :offset="dividerWidth"
    :positions="[tie.from, tie.to]"
  >
    <svg v-if="from && to">
      <TieCurve
        v-if="hasTie"
        ref="tieCurve"
        :close="tie.type === TieType.TieSlide"
        :x1="from.center"
        :x2="to.center"
        :y="startRowTop + row * cellHeight - 1"
        :shift-label="showLabel === 'shift'"
      />
      <line
        v-if="hasSlide"
        :x1="from.center + (from.right - from.left) * 0.4"
        :x2="to.center - (to.right - to.left) * 0.4"
        :y1="startRowTop + slideRowStart * cellHeight"
        :y2="startRowTop + slideRowEnd * cellHeight"
      />
      <TieSelect
        v-if="showLabel && tie.to !== tie.from"
        :active="selectActive"
        :tie
        :x="hasSlide ? (from.right + to.left) / 2 - 20 : tieCurve?.label.x ?? 0"
        :y="
          hasSlide
            ? startRowTop + slideRowEnd * cellHeight
            : tieCurve?.label.y ?? 0
        "
        :hide="hasSlide"
        @mouseenter="() => (selectHovered = true)"
        @mouseleave="() => (selectHovered = false)"
      />
    </svg>
  </OverlayCoords>
</template>

<style scoped>
line {
  stroke: var(--tie-color);
  stroke-width: 1;
}
</style>
