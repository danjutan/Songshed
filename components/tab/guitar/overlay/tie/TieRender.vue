<script lang="ts" setup>
import type { Tie } from "~/model/stores";
import OverlayCoords from "../OverlayCoords.vue";
import TieCurve from "./TieCurve.vue";
import TieSelect from "./TieSelect.vue";
import { injectEditingState } from "~/components/tab/providers/state/provide-editing-state";
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import { TieType } from "~/model/data";
import { injectTieAddState } from "~/components/tab/providers/state/provide-tie-add-state";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";

const props = defineProps<{
  tie: Tie;
  overDivider: boolean;
}>();

const { editingNote } = injectEditingState();
const { hoveredCell } = injectCellHoverEvents();
const settings = injectSettingsState();
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
  if (tieAddState.dragging) return false;
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

const startRowTop = computed(
  () => settings.contextMenuHeight + settings.cellHeight,
);
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to], cellHeight }"
    :positions="[tie.from, tie.to]"
  >
    <svg v-if="from && to">
      <TieCurve
        v-if="
          [TieType.Hammer, TieType.Tap, TieType.TieSlide].includes(tie.type)
        "
        v-slot="{ x, y }"
        :close="tie.type === TieType.TieSlide"
        :x1="from.center"
        :x2="to.center"
        :y="startRowTop + (row - 0.2) * cellHeight"
        :shift-label="overDivider"
      >
        <TieSelect
          v-if="tie.to !== tie.from"
          :active="selectActive"
          :tie
          :x
          :y
          @mouseenter="selectHovered = true"
          @mouseleave="selectHovered = false"
        />
      </TieCurve>
      <template v-if="[TieType.Slide, TieType.TieSlide].includes(tie.type)">
        <line
          :x1="from.center + (from.right - from.left) * 0.4"
          :x2="to.center - (to.right - to.left) * 0.4"
          :y1="startRowTop + slideRowStart * cellHeight"
          :y2="startRowTop + slideRowEnd * cellHeight"
        />
        <TieSelect
          v-if="tie.to !== tie.from && selectActive"
          active
          :x="(from.right + to.left) / 2 - 20"
          :y="startRowTop + slideRowEnd * cellHeight"
          :tie
          @mouseenter="selectHovered = true"
          @mouseleave="selectHovered = false"
        />
      </template>
    </svg>
  </OverlayCoords>
</template>

<style scoped>
line {
  stroke: black;
  stroke-width: 1;
}
</style>
