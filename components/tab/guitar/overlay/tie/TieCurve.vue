<script lang="ts" setup>
import { computed, useId } from "vue";

const props = defineProps<{
  x1: number;
  x2: number;
  y: number;
}>();

const bottom = computed(() => {
  return props.y + Math.abs(props.x2 - props.x1) * 0.1;
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

const id = useId();
</script>

<template>
  <defs>
    <mask :id="`mask-${id}`">
      <path :d="curvePath" fill="white" />
      <rect
        :x="(x2 + x1) / 2 - 5"
        :y="bottom - 5"
        :width="11"
        :height="10"
        fill="black"
      />
    </mask>
  </defs>
  <path :d="curvePath" :mask="`url(#mask-${id})`" />
  <text :x="(x2 + x1) / 2 - 5" :y="bottom + 5">H</text>
</template>

<style scoped></style>
