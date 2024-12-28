<script lang="ts" setup>
import { computed, useId } from "vue";
import OverlaySelect from "../OverlaySelect.vue";
import { reactiveComputed } from "@vueuse/core";

const props = defineProps<{
  x1: number;
  x2: number;
  y: number;
  shiftLabel?: boolean;
}>();

const bottom = computed(() => {
  return props.y + Math.min(Math.abs(props.x2 - props.x1) * 0.075, 12);
});

const curvePath = computed(() => {
  const curvePointX = (props.x2 + props.x1) / 2;
  const controlY = 2 * bottom.value - props.y; // from the derivative of the quadratic Bezier curve
  const pathData = `
    M ${props.x1},${props.y}
    Q ${curvePointX},${controlY - 2} ${props.x2},${props.y}
    Q ${curvePointX},${controlY + 2} ${props.x1},${props.y}
    Z`;

  return pathData;
});

const label = reactiveComputed(() => {
  return {
    x: (props.x2 + props.x1) / 2 + (props.shiftLabel ? 6 : -5),
    y: bottom.value + 5,
  };
});

const id = useId();
</script>

<template>
  <defs>
    <mask :id="`mask-${id}`">
      <path :d="curvePath" fill="white" />
      <rect
        :x="label.x"
        :y="bottom - 5"
        :width="11"
        :height="10"
        fill="black"
      />
    </mask>
  </defs>
  <path :d="curvePath" :mask="`url(#mask-${id})`" />
  <text :x="label.x" :y="label.y">H</text>
  <!-- <foreignObject :x="(x2 + x1) / 2 - 5" :y="bottom" width="100" height="100">
    <OverlaySelect
      :placeholder="'H'"
      :options="[
        ['H', 'H'],
        ['P', 'P'],
        ['/', 'slide'],
      ]"
    />
  </foreignObject> -->
</template>

<style scoped></style>
