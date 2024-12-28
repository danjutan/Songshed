<script lang="ts" setup>
import type { Tie } from "~/model/stores";
import OverlayCoords from "../OverlayCoords.vue";
import TieCurve from "./TieCurve.vue";
import { injectEditTie } from "./provide-edit-tie";

const props = defineProps<{
  tie: Tie;
  firstRow: number;
  overDivider: boolean;
}>();

const { updateType } = injectEditTie();

const connected = computed(
  () => props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined,
);

const ascending = computed(
  () => !connected.value || props.tie.midiFrom! < props.tie.midiTo!,
);
const row = computed(() => props.firstRow + props.tie.string);

const slideRowStart = computed(() =>
  ascending.value ? row.value - 0.8 : row.value - 0.2,
);
const slideRowEnd = computed(() =>
  ascending.value ? row.value + -0.2 : row.value - 0.8,
);
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to], cellHeight }"
    :positions="[tie.from, tie.to]"
  >
    <svg v-if="from && to">
      <TieCurve
        v-if="tie.type.hammer"
        :x1="from.center"
        :x2="to.center"
        :y="(firstRow + tie.string - 0.2) * cellHeight"
        :shift-label="overDivider"
      />
      <line
        v-if="tie.type.slide"
        :x1="from.center + (from.right - from.left) * 0.4"
        :x2="to.center - (to.right - to.left) * 0.4"
        :y1="slideRowStart * cellHeight"
        :y2="slideRowEnd * cellHeight"
      />
    </svg>
  </OverlayCoords>
</template>

<style scoped>
path,
line {
  stroke: black;
  stroke-width: 1;
}
text {
  pointer-events: all;
}
</style>
