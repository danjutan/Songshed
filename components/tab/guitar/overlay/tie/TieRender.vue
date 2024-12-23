<script lang="ts" setup>
import type { Tie } from "~/model/stores";
import { useTiePath } from "./use-tie-path";
import OverlayCoords from "../OverlayCoords.vue";

const props = withDefaults(defineProps<{ tie: Tie; firstRow: number }>(), {
  firstRow: 1,
});

const connected = computed(
  () => props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined,
);

const ascending = computed(
  () => !connected.value || props.tie.midiFrom! < props.tie.midiTo!,
);
const row = computed(() => props.firstRow + props.tie.string - 1);

const slideRowStart = computed(() =>
  ascending.value ? row.value + 0.2 : row.value + 0.8,
);
const slideRowEnd = computed(() =>
  ascending.value ? row.value + 0.8 : row.value + 0.2,
);
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to], cellHeight }"
    :positions="[tie.from, tie.to]"
  >
    <svg v-if="from && to">
      <path
        v-if="tie.type.hammer"
        :d="
          useTiePath(
            (from.center + from.right) / 2,
            (to.center + to.left) / 2,
            (firstRow + tie.string - 0.1) * cellHeight,
          )
        "
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
</style>
