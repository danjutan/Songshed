<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import type { OverlayPosition } from "../../overlay-objects";

export type BendRenderProps = OverlayPosition & {
  bend: Bend;
  throughColumns: number[];
};
const props = defineProps<BendRenderProps & { bendRow: number }>();

const upswingEndColumn = computed(
  () => props.throughColumns[0] || props.endColumn,
);

const upswingColumns = computed(
  () => upswingEndColumn.value - props.startColumn + 1,
);

const restColumns = computed(() => props.endColumn - upswingEndColumn.value);

console.log(restColumns.value);

const rowSpan = computed(() => props.row - props.bendRow + 1);

const vbu = 12;

const bendLabels: { [bend: number]: string } = {
  1: "full",
  0.5: "1/2",
  1.5: "1 1/2",
};
</script>

<template>
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
        `Q ${vbu * upswingColumns - vbu / 2} ${vbu * rowSpan - vbu * 0.75} ${vbu * upswingColumns - vbu / 2} ${vbu * 0.8}`
      "
      marker-end="url(#arrow)"
    />
  </svg>
  <template v-if="restColumns > 0">
    <svg
      v-if="bend.releaseType === 'connect'"
      class="downswing"
      :viewBox="`0 0 ${vbu * restColumns} ${vbu * rowSpan}`"
      preserveAspectRatio="none"
    >
      <path
        class="downswing-curve"
        :d="
          `M ${vbu * 0.75} ${vbu * 0.35}` +
          `Q ${vbu * restColumns - vbu / 2} ${vbu / 2} ${vbu * restColumns - vbu / 2} ${vbu * rowSpan - vbu * 0.85}`
        "
        marker-end="url(#arrow)"
      />
    </svg>
    <svg
      v-else
      class="hold"
      :viewBox="`0 0 ${vbu * restColumns} ${vbu}`"
      preserveAspectRatio="none"
    >
      <line
        class="hold-line"
        :x1="vbu * 0.75"
        :x2="vbu * restColumns - vbu / 2"
        :y1="vbu * 0.35"
        :y2="vbu * 0.35"
      />
    </svg>
  </template>
  <div class="label">
    <span>{{ bendLabels[props.bend.bend] || props.bend.bend }}</span>
  </div>
</template>

<style scoped>
.label {
  grid-row: v-bind(bendRow);
  grid-column: v-bind(upswingEndColumn);
  font-size: calc(var(--note-font-size) * 0.75);
  justify-self: center;
  background-color: white;
  height: min-content;
}

.upswing,
.downswing,
.hold {
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.upswing,
.downswing {
  grid-row: v-bind(bendRow) / calc(v-bind(row) + 1);
}

.hold {
  grid-row: v-bind(bendRow);
}

.upswing {
  /* background-color: yellow;
  opacity: 0.5; */
  grid-column: v-bind(startColumn) / calc(v-bind(upswingEndColumn) + 1);
}

.downswing,
.hold {
  grid-column: v-bind(upswingEndColumn) / calc(v-bind(endColumn) + 1);
}

.upswing-curve,
.downswing-curve,
.hold-line {
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
