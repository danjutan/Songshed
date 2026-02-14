<script lang="ts" setup>
import { computed, useId } from "vue";
import OverlaySelect from "~/components/editor/tab/bars/guitar/overlay/OverlaySelect.vue";
import { reactiveComputed } from "@vueuse/core";
import type { StackCoords } from "~/components/editor/tab/providers/events/provide-resize-observer";
import {
  useCoordsDirective,
  type ValueFn,
} from "~/components/editor/tab/hooks/use-coords-directive";

const props = defineProps<{
  fromPos: number;
  toPos: number;
  y: number;
  close: boolean;
  shiftLabel?: boolean;
  labelX: ValueFn<"from" | "to", number>;
  labelY: ValueFn<"from" | "to", number>;
  curveBottom: (center1: number, center2: number) => number;
}>();

const vCoords = useCoordsDirective({
  from: computed(() => props.fromPos),
  to: computed(() => props.toPos),
});

const curvePath: ValueFn<"from" | "to"> = ({ from, to }) => {
  const x1 = from.center;
  const x2 = to.center;
  const curvePointX = (x2 + x1) / 2;
  const controlY = 2 * props.curveBottom(x1, x2) - props.y; // from the derivative of the quadratic Bezier curve
  const pathData = `
    M ${x1},${props.y}
    Q ${curvePointX},${controlY - 2} ${x2},${props.y}
    Q ${curvePointX},${controlY + 2} ${x1},${props.y}
    Z`;

  return pathData;
};

const id = useId();
</script>

<template>
  <defs>
    <mask :id="`mask-${id}`">
      <path v-coords:d="curvePath" />
      <rect
        v-coords:x="(coords) => labelX(coords) + 3"
        v-coords:y="(coords) => labelY(coords) + 5"
        :width="11"
        :height="10"
      />
    </mask>
  </defs>
  <path
    v-coords:d="curvePath"
    class="tie-curve"
    :mask="!close ? `url(#mask-${id})` : undefined"
  />
</template>

<style scoped>
mask path {
  fill: white;
}

.tie-curve {
  fill: var(--tie-color);
}
</style>
