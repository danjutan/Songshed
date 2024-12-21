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

const rowSpan = computed(() => props.row - props.bendRow + 1);

const vbu = 12;

const bendLabels: { [bend: number]: string } = {
  1: "full",
  0.5: "1/2",
  1.5: "1 1/2",
};

const upswingArrowHover = ref(false);
const endArrowHover = ref(false);
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

    <marker
      id="hover-arrow"
      viewBox="0 0 10 10"
      refX="5"
      refY="5"
      markerWidth="8"
      markerHeight="8"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>

    <path
      class="upswing-curve"
      :d="
        `M ${vbu * 0.75} ${vbu * rowSpan - vbu * 0.75}` +
        `Q ${vbu * upswingColumns - vbu / 2} ${vbu * rowSpan - vbu * 0.75} ${vbu * upswingColumns - vbu / 2} ${vbu * 1.1}`
      "
      :marker-end="upswingArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
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
          `M ${vbu * 0.75} ${vbu * 0.6}` +
          `Q ${vbu * restColumns - vbu / 2} ${vbu * 0.6} ${vbu * restColumns - vbu / 2} ${vbu * rowSpan - vbu * 0.85}`
        "
        :marker-end="endArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
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
        :y1="vbu * 0.6"
        :y2="vbu * 0.6"
        :marker-end="endArrowHover ? 'url(#hover-arrow)' : undefined"
      />
    </svg>
    <div
      :class="
        bend.releaseType === 'connect'
          ? 'downswing-arrow-hover'
          : 'hold-arrow-hover'
      "
      @mouseover="endArrowHover = true"
      @mouseleave="endArrowHover = false"
    />
  </template>
  <div class="label">
    <div class="row">
      <span>{{ bendLabels[props.bend.bend] || props.bend.bend }}</span>
      <div v-if="!restColumns" class="grabber right" />
    </div>
  </div>
  <div
    class="upswing-arrow-hover"
    @mouseover="upswingArrowHover = true"
    @mouseleave="upswingArrowHover = false"
  />
</template>

<style scoped>
.upswing,
.downswing,
.hold {
  width: 100%;
  height: 100%;
  overflow: visible;
  /* pointer-events: none; */
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

.label {
  grid-row: v-bind(bendRow);
  grid-column: v-bind(upswingEndColumn);
  font-size: calc(var(--note-font-size) * 0.75);
  justify-self: center;
  align-self: end;
  /* background-color: yellow; */
  height: min-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent;
  /* height: calc(100% + var(--cell-height) / 2); */
  width: calc(120%);
  /* margin-bottom: calc(var(--cell-height) * -0.75); */

  & .row {
    display: flex;
    align-items: center;
  }

  &:hover .grabber {
    visibility: visible;
  }
}

.upswing-arrow-hover,
.downswing-arrow-hover,
.hold-arrow-hover {
  z-index: 1;
  width: 100%;
  cursor: move;
}
.upswing-arrow-hover {
  grid-row: calc(v-bind(bendRow) + 1);
  grid-column: v-bind(upswingEndColumn);
  height: calc(100% + var(--cell-height) * 0.1);
  margin-top: calc(var(--cell-height) * -0.1);
  /* height: calc(var(--cell-height) / 2); */
}

.downswing-arrow-hover {
  height: 100%;
  margin-top: -30%;
  grid-row: v-bind(row);
  grid-column: v-bind(endColumn);
}

.hold-arrow-hover {
  grid-row: v-bind(bendRow);
  grid-column: v-bind(endColumn);
}

.grabber {
  width: calc(var(--note-font-size) * 0.4);
  height: calc(var(--note-font-size) * 0.4);
  background-color: black;
  border-radius: 50%;
  visibility: hidden;

  &.right {
    margin-right: calc(var(--note-font-size) * -0.5);
    margin-left: calc(var(--note-font-size) * 0.1);
  }
}
</style>
