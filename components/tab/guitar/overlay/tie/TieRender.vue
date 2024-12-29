<script lang="ts" setup>
import type { Tie } from "~/model/stores";
import OverlayCoords from "../OverlayCoords.vue";
import TieCurve from "./TieCurve.vue";
import TieSelect from "./TieSelect.vue";
import { injectEditingState } from "~/components/tab/providers/state/provide-editing-state";
const props = defineProps<{
  tie: Tie;
  firstRow: number;
  overDivider: boolean;
}>();

const { editingNote } = injectEditingState();

const connected = computed(
  () => props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined,
);

const ascending = computed(
  () => !connected.value || props.tie.midiFrom! < props.tie.midiTo!,
);
const row = computed(() => props.firstRow + props.tie.string);

const slideRowStart = computed(() =>
  ascending.value ? row.value + -0.2 : row.value - 0.8,
);

const slideRowEnd = computed(() =>
  ascending.value ? row.value - 0.8 : row.value - 0.2,
);

const showTie = computed(() => {
  if (editingNote?.string && editingNote?.position) {
    return (
      editingNote.string === props.tie.string &&
      [props.tie.from, props.tie.to].includes(editingNote.position)
    );
  }

  return false;
});
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to], cellHeight }"
    :positions="[tie.from, tie.to]"
  >
    <svg v-if="from && to">
      <TieCurve
        v-if="tie.type.hammer"
        v-slot="{ x, y }"
        :x1="from.center"
        :x2="to.center"
        :y="(firstRow + tie.string - 0.2) * cellHeight"
        :shift-label="overDivider"
      >
        <TieSelect :active="showTie" :tie :x :y />
      </TieCurve>
      <template v-if="tie.type.slide">
        <line
          :x1="from.center + (from.right - from.left) * 0.4"
          :x2="to.center - (to.right - to.left) * 0.4"
          :y1="slideRowStart * cellHeight"
          :y2="slideRowEnd * cellHeight"
        />
      </template>
    </svg>
  </OverlayCoords>
</template>

<style scoped>
path,
line {
  stroke: black;
  stroke-width: 1;
}
</style>
