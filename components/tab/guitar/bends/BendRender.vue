<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import type { OverlayPosition } from "../../overlay-objects";
import {
  BendEditInjectionKey,
  type BendEditState,
} from "../state/bend-edit-state";

export type BendRenderProps = OverlayPosition & {
  bend: Bend;
  throughColumn?: number;
  half?: "left" | "right";
  fullUpswingColumns?: number;
  fullRestColumns?: number;
};

const props = defineProps<BendRenderProps & { bendRow: number }>();

const bendEditState = inject(BendEditInjectionKey) as BendEditState;

const noUpswing = computed(
  () => props.half === "right" && props.fullRestColumns,
);

const upswingEndColumn = computed(() => {
  if (noUpswing.value) {
    return props.startColumn - 1;
  }
  return props.throughColumn || props.endColumn;
});

const prebend = computed(
  () => props.half !== "right" && props.startColumn === upswingEndColumn.value,
);

const upswingColumns = computed(
  () => upswingEndColumn.value - props.startColumn + 1,
);

const restColumns = computed(() => props.endColumn - upswingEndColumn.value);

const rowSpan = computed(() => props.row - props.bendRow + 1);

const vbu = 12;

const upswingFrom = computed(() => {
  if (props.half === "right" && props.fullUpswingColumns) {
    return (upswingColumns.value - props.fullUpswingColumns) * vbu + vbu * 0.75;
  }
  return vbu * 0.75;
});

const upswingTo = computed(() => {
  const columns =
    (props.half === "left" && props.fullUpswingColumns) || upswingColumns.value;
  return columns * vbu - vbu / 2;
});

const downswingFrom = computed(() => {
  if (noUpswing.value) {
    return vbu * (restColumns.value - props.fullRestColumns!);
  }
  return 0;
});

const downswingTo = computed(() => {
  if (props.half === "left" && props.fullRestColumns) {
    return vbu * props.fullRestColumns - vbu / 2 - 1;
  }
  return vbu * restColumns.value - vbu / 2 - 1;
});

const showLabel = computed(() => {
  if (props.fullRestColumns) {
    return props.half === "left";
  }
  return props.half !== "left";
});

const bendLabels: { [bend: number]: string } = {
  0.5: "&half;",
  1: "full",
  1.5: "1 &half;",
};

function onSelectInput(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  if (value === "delete") {
    bendEditState.deleteBend(props.bend);
    return;
  }
  bendEditState.updateBendBy(props.bend, +value);
}

const upswingArrowHover = ref(false);
const releaseArrowHover = ref(false);
</script>

<template>
  <svg
    v-if="!noUpswing"
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
        prebend
          ? `M ${vbu / 2} ${vbu * rowSpan - vbu}` + `V ${vbu * 1.1}`
          : `M ${upswingFrom} ${vbu * rowSpan - vbu * 0.6}` +
            `Q ${upswingTo} ${vbu * rowSpan - vbu * 0.75} ${upswingTo} ${vbu * 1.1}`
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
          `M ${downswingFrom} ${vbu * 0.6}` +
          `Q ${downswingTo} ${vbu * 0.6} ${downswingTo} ${vbu * rowSpan - vbu * 0.95}`
        "
        :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
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
        :x1="0"
        :x2="
          props.half === 'left'
            ? vbu * restColumns
            : vbu * restColumns - vbu / 2
        "
        :y1="vbu * 0.6"
        :y2="vbu * 0.6"
        :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : undefined"
      />
    </svg>
    <div
      :class="
        bend.releaseType === 'connect'
          ? 'downswing-arrow-hover'
          : 'hold-arrow-hover'
      "
      @mousedown="bendEditState.start('release', props.bend)"
      @mouseover="releaseArrowHover = true"
      @mouseleave="releaseArrowHover = false"
    />
  </template>
  <div
    v-if="showLabel"
    class="label"
    :class="{ dragging: bendEditState.dragging }"
    @mouseover="bendEditState.onLabelHover"
  >
    <span v-html="bendLabels[props.bend.bend] || props.bend.bend" />
    <select @input="onSelectInput">
      <option
        v-for="[bendBy, label] in Object.entries(bendLabels).sort(
          (a, b) => +a[0] - +b[0],
        )"
        :value="bendBy"
        :selected="props.bend.bend === +bendBy"
        v-html="label"
      />
      <option value="delete">&Cross;</option>
    </select>
    <!-- <div v-if="!restColumns" class="grabber right" /> -->
  </div>
  <div
    v-if="!restColumns && !bendEditState.dragging"
    class="grabber-hover"
    @mousedown="bendEditState.start('release', props.bend)"
  >
    <div class="grabber" />
  </div>
  <div
    class="upswing-arrow-hover"
    @mousedown="bendEditState.start('upswing', props.bend)"
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
  pointer-events: none;
}

.upswing,
.downswing {
  grid-row: v-bind(bendRow) / calc(v-bind(row) + 1);
  overflow: hidden;
  z-index: 1;
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
  grid-column: calc(v-bind(upswingEndColumn) + 1) / calc(v-bind(endColumn) + 1);
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
  height: 100%;
  font-size: calc(var(--note-font-size) * 0.75);
  justify-self: center;
  align-self: end;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: calc(120%);

  &:not(.dragging):hover {
    span {
      display: none;
    }
    select {
      display: block;
    }
  }

  & select {
    position: absolute;
    transform: translateX(-12%);
    z-index: 1;
    display: none;
    text-align: center;

    & [value="delete"] {
      color: darkred;
    }
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
  margin-top: -50%;
  grid-row: v-bind(row);
  grid-column: v-bind(endColumn);
}

.hold-arrow-hover {
  grid-row: v-bind(bendRow);
  grid-column: v-bind(endColumn);
}

.grabber-hover {
  grid-row: v-bind(bendRow);
  grid-column: calc(v-bind(upswingEndColumn) + 1) / span 2; /*span 2 so that it is fully visible over a divider*/
  width: 50%;
  display: flex;
  align-items: center;
  cursor: move;
}
.grabber {
  width: calc(var(--note-font-size) * 0.4);
  height: calc(var(--note-font-size) * 0.4);
  background-color: black;
  border-radius: 50%;
  margin-bottom: calc(var(--note-font-size) * -0.4);
  margin-left: calc(var(--note-font-size) * 0.1);
  visibility: hidden;
}
/* maybe always have the grabber visible */
.grabber-hover:hover .grabber,
.label:hover + .grabber-hover .grabber {
  visibility: visible;
}
</style>
