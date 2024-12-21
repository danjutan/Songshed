<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import {
  type StackCoords,
  StackResizeObserverInjectionKey,
  type StackResizeObserver,
  withOffset,
} from "../../../state/stack-resize-observer";
import {
  SettingsInjectionKey,
  type Settings,
} from "../../../state/settings-state";
import {
  BendEditInjectionKey,
  type BendEditState,
} from "../../state/bend-edit-state";
import { useBendCoords } from "./use-bend-coords";
import {
  CellHoverInjectionKey,
  type CellHoverEvents,
} from "~/components/tab/state/cell-hover-events";

export interface BendRenderProps {
  bend: Bend;
  tablineStart: number;
  tablineLast: number;
}

const props = defineProps<BendRenderProps>();

const resizeObserver = inject(
  StackResizeObserverInjectionKey,
) as StackResizeObserver;

const settingState = inject(SettingsInjectionKey) as Settings;
const cellHeight = computed(() => parseInt(settingState.cellHeight));

const bendEditState = inject(BendEditInjectionKey) as BendEditState;

const safetyCheck = computed(
  () =>
    resizeObserver.getStackCoords(props.bend.from) &&
    resizeObserver.getStackCoords(props.bend.to),
);

const startY = computed(() => {
  return cellHeight.value * (props.bend.string + 2);
});

const coords = useBendCoords(resizeObserver, props);

const upswingPath = computed(() => {
  const sy = startY.value,
    ch = cellHeight.value,
    ux = coords.upswingTo.center;

  if (coords.prebend) {
    return `M ${coords.from.center} ${sy - ch * 0.85}` + `V ${ch * 0.75} `;
  }

  return (
    `M ${(coords.from.right + coords.from.center) / 2} ${sy - ch * 0.6} ` +
    `Q ${ux} ${sy - ch * 0.55} ${ux} ${ch * 0.75}`
  );
});

const releasePath = computed(() => {
  if (!coords.through) return;
  const ch = cellHeight.value;
  return (
    `M ${coords.through.right} ${ch * 0.35} ` +
    `Q ${coords.to.center} ${ch * 0.35} ${coords.to.center} ${startY.value - ch * 0.95}`
  );
});

const showLabel = computed(() => {
  if (!coords.throughPoint) return true;
  if (coords.isRightHalf) {
    return coords.throughPoint > props.tablineStart;
  }
  return coords.throughPoint <= props.tablineLast;
});

const bendLabels: { [bend: number]: string } = {
  0.5: "&half;",
  1: "full",
  1.5: "1 &half;",
};

const bendLabel = computed(
  () => bendLabels[props.bend.bend] || props.bend.bend,
);

function onSelectInput(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  if (value === "delete") {
    bendEditState.deleteBend(props.bend);
    return;
  }
  bendEditState.setBendValue(props.bend, +value);
}

const selectHeight = "18px";

const upswingArrowHover = ref(false);
const releaseArrowHover = ref(false);
</script>

<template>
  <g v-if="safetyCheck" :class="`bend-${bend.from}-${bend.to}-s${bend.string}`">
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
    <rect
      :x="coords.upswingTo.left"
      :y="0"
      :width="coords.upswingTo.right - coords.upswingTo.left"
      :height="cellHeight * 1.5"
      opacity="0"
      @mousedown="bendEditState.start('upswing', props.bend)"
      @mouseover="upswingArrowHover = true"
      @mouseleave="upswingArrowHover = false"
    />
    <foreignObject
      v-if="showLabel"
      :x="
        coords.upswingTo.left -
        1.3 * (coords.upswingTo.right - coords.upswingTo.left)
      "
      :y="0"
      :width="3 * (coords.upswingTo.right - coords.upswingTo.left)"
      :height="selectHeight"
      @mouseover="bendEditState.onLabelHover"
    >
      <div :class="{ dragging: bendEditState.dragging }" class="bend-label">
        <select ref="select" @input="onSelectInput">
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
        <span v-html="bendLabel" />
      </div>
    </foreignObject>
    <path
      class="upswing-curve"
      :d="upswingPath"
      :marker-end="upswingArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
    />
    <g v-if="coords.through">
      <path
        v-if="bend.releaseType === 'connect'"
        class="downswing-curve"
        :d="releasePath"
        :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
      />
      <line
        v-else
        class="hold-line"
        :x1="coords.through.right"
        :x2="coords.to.center"
        :y1="cellHeight * 0.35"
        :y2="cellHeight * 0.35"
        :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : undefined"
      />
    </g>
    <rect
      class="release-grabber"
      :x="coords.through ? coords.to.left : coords.to.right"
      :y="
        coords.through && bend.releaseType === 'connect'
          ? startY - cellHeight * 1.5
          : 0
      "
      :width="coords.to.right - coords.to.left"
      :height="cellHeight"
      opacity="0"
      @mousedown="bendEditState.start('release', props.bend)"
      @click="
        bendEditState.onReleaseGrabberClick(
          resizeObserver.getNextStackPos(props.bend.to)!,
        )
      "
      @mouseover="releaseArrowHover = true"
      @mouseleave="releaseArrowHover = false"
    />
    <line
      v-if="!coords.through"
      :x1="coords.to.right"
      :y1="cellHeight * 0.35"
      :x2="coords.to.right + (coords.to.right - coords.to.left) * 0.6"
      :y2="cellHeight * 0.35"
      stroke="black"
      opacity="0.4"
      :marker-end="'url(#arrow)'"
    />
  </g>
</template>

<style scoped>
.upswing-curve,
.downswing-curve,
.hold-line {
  stroke: red;
  stroke-width: 1;
  fill: none;
  /* vector-effect: non-scaling-stroke; */
}

.bend-label {
  display: grid;
  justify-content: center;
  /* justify-content: center; */
  width: 120%;
  &:not(.dragging) {
    select:hover + span {
      background-color: lightgray;
    }
  }

  & span {
    font-size: calc(var(--note-font-size) * 0.75);
    cursor: text;
    background: white;
    padding-left: 10px;
    padding-right: 10px;
    margin-left: -2px;
    margin-top: 1px;
    grid-row: 1 / 1;
    grid-column: 1 / 1;
  }

  & select {
    pointer-events: all;
    width: calc(var(--cell-height));
    margin-top: 1px;
    cursor: text;
    appearance: none;
    border: none;
    outline: none;
    text-align: center;
    height: v-bind(selectHeight);
    grid-row: 1 / 1;
    grid-column: 1 / 1;

    & [value="delete"] {
      color: darkred;
    }
  }
}

rect {
  pointer-events: all;
  cursor: move;
}

.release-grabber + line {
  display: none;
}
.release-grabber:hover + line {
  display: block;
}
</style>
