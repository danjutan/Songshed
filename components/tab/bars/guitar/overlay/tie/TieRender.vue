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
import {
  useCoordsDirective,
  type ValueFn,
} from "~/components/tab/hooks/use-coords-directive";

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

const vCoords = useCoordsDirective({
  from: computed(() => props.tie.from),
  to: computed(() => props.tie.to),
});

const shiftLabel = computed(() => props.showLabel === "shift");

const labelX: ValueFn<"from" | "to", number> = ({ from, to }) => {
  return (from.center + to.center) / 2 - 1 + (shiftLabel.value ? 6 : -8);
};

const labelY: ValueFn<"from" | "to", number> = ({ from, to }) => {
  return curveBottom(from.center, to.center) - 10;
};

const curveBottom = (center1: number, center2: number) => {
  return (
    startRowTop.value +
    row.value * cellHeight.value -
    1 +
    Math.min(Math.abs(center2 - center1) * 0.075, 12)
  );
};
</script>

<template>
  <svg>
    <TieCurve
      v-if="hasTie"
      ref="tieCurve"
      :close="tie.type === TieType.TieSlide"
      :from-pos="tie.from"
      :to-pos="tie.to"
      :y="startRowTop + row * cellHeight - 1"
      :shift-label="shiftLabel"
      :label-x="labelX"
      :label-y="labelY"
      :curve-bottom="curveBottom"
    />
    <line
      v-if="hasSlide"
      v-coords:x1="({ from }) => from.center + (from.right - from.left) * 0.4"
      v-coords:x2="({ to }) => to.center - (to.right - to.left) * 0.4"
      :y1="startRowTop + slideRowStart * cellHeight"
      :y2="startRowTop + slideRowEnd * cellHeight"
    />
    <TieSelect
      v-if="showLabel && tie.to !== tie.from"
      :active="selectActive"
      :tie
      :from-pos="tie.from"
      :to-pos="tie.to"
      :left-value="
        (coords) =>
          hasSlide
            ? (coords.from.right + coords.to.left) / 2 - 20
            : labelX(coords)
      "
      :top-value="
        (coords) =>
          hasSlide ? startRowTop + slideRowEnd * cellHeight : labelY(coords)
      "
      :hide="hasSlide"
      @mouseenter="() => (selectHovered = true)"
      @mouseleave="() => (selectHovered = false)"
    />
  </svg>
</template>

<style scoped>
line {
  stroke: var(--tie-color);
  stroke-width: 1;
}
</style>
