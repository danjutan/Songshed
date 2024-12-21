<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import type { OverlayPosition } from "../../overlay-objects";

const props = defineProps<OverlayPosition & { bendRow: number; bend: Bend }>();

const upswingEnd = computed(() =>
  props.bend.through?.[0]
    ? props.bend.through[0] + props.bend.from
    : props.bend.to,
);
const upswingColumns = computed(
  () =>
    1 +
    ((upswingEnd.value - props.bend.from) / (props.bend.to - props.bend.from)) *
      (props.endColumn - props.startColumn),
);

const restColumns = computed(
  () => props.endColumn - props.startColumn - upswingColumns.value,
);

const rowSpan = computed(() => props.row - props.bendRow + 1);

console.log({ upswingColumns: upswingColumns.value });

const vbu = 12;

const bendLabels: { [bend: number]: string } = {
  1: "full",
  0.5: "1/2",
  1.5: "1 1/2",
};
</script>

<template>
  <div class="label">
    <span>{{ bendLabels[props.bend.bend] || props.bend.bend }}</span>
  </div>
  <svg
    class="upswing"
    :viewBox="`0 0 ${vbu * upswingColumns} ${vbu * rowSpan}`"
    preserveAspectRatio="none"
  >
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="5"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>

    <path
      class="upswing-curve"
      :d="
        `M ${vbu * 0.75} ${vbu * rowSpan - vbu * 0.75}` +
        `Q ${vbu * upswingColumns - vbu / 2} ${vbu * rowSpan - vbu * 0.75} ${vbu * upswingColumns - vbu / 2} ${(vbu * 3) / 4}`
      "
      marker-end="url(#arrow)"
    />

    <!-- <rect
      :x="0"
      :y="0"
      :width="vbu * upswingColumns"
      :height="vbu * rowSpan"
      fill="transparent"
      stroke="blue"
    /> -->
  </svg>
</template>

<style scoped>
.label {
  grid-row: v-bind(bendRow);
  grid-column: calc(v-bind(startColumn) + v-bind(upswingColumns) - 1);
  font-size: calc(var(--note-font-size) * 0.75);
  justify-self: center;
}
.upswing {
  /* background-color: yellow;
  opacity: 0.5; */
  /* width: calc(100% - 100% / v-bind(upswingColumns)); */
  width: 100%;
  justify-self: center;
  height: 100%;
  /* grid-column: v-bind(startColumn) / calc(v-bind(endColumn) + 1); */
  grid-column: v-bind(startColumn) / span calc(v-bind(upswingColumns));
  grid-row: v-bind(bendRow) / calc(v-bind(row) + 1);
  overflow: visible;
}

.upswing-curve {
  stroke: black;
  stroke-width: 1;
  fill: none;
  vector-effect: non-scaling-stroke;
}

marker,
marker path {
  vector-effect: non-scaling-size;
}
</style>
