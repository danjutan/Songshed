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
  bendEditState.updateBendBy(props.bend, +value);
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
    <path
      class="upswing-curve"
      :d="upswingPath"
      :marker-end="upswingArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
    />
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
      <rect
        :x="coords.to.left"
        :y="bend.releaseType === 'connect' ? startY - cellHeight * 1.5 : 0"
        :width="coords.to.right - coords.to.left"
        :height="cellHeight"
        opacity="0"
        @mousedown="bendEditState.start('release', props.bend)"
        @mouseover="releaseArrowHover = true"
        @mouseleave="releaseArrowHover = false"
      />
    </g>
    <foreignObject
      v-if="showLabel"
      :x="
        coords.upswingTo.left -
        1.3 * (coords.upswingTo.right - coords.upswingTo.left)
      "
      :y="0"
      :width="3 * (coords.upswingTo.right - coords.upswingTo.left)"
      :height="cellHeight"
    >
      <div :class="{ dragging: bendEditState.dragging }" class="bend-label">
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
        <span v-html="bendLabel" />
      </div>
    </foreignObject>
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
  height: 100%;
  font-size: calc(var(--note-font-size) * 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  /* justify-content: center; */
  width: 120%;

  &:not(.dragging) {
    span:hover,
    select:hover + span {
      background-color: lightgray;
      width: var(--cell-height);
      text-align: center;
      /* display: none;
      & + select {
        display: block;
      } */
    }
  }

  & span {
    cursor: text;
  }

  & select {
    position: absolute;
    width: var(--cell-height);
    cursor: text;
    opacity: 0;
    text-align: center;
    height: v-bind(selectHeight);

    & [value="delete"] {
      color: darkred;
    }
  }
}

rect {
  pointer-events: all;
  cursor: move;
}
</style>
