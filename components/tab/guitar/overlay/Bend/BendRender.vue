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
import OverlayCoords from "../OverlayCoords.vue";

export interface BendRenderProps {
  bend: Bend;
  tablineStart: number;
  tablineLast: number;
}

const props = defineProps<BendRenderProps>();
const bendEditState = inject(BendEditInjectionKey) as BendEditState;

const settingState = inject(SettingsInjectionKey) as Settings;
const cellHeight = computed(() => parseInt(settingState.cellHeight));

const startY = computed(() => {
  return cellHeight.value * (props.bend.string + 2);
});

const hasThrough = computed(() => !!props.bend.through?.length);
const throughPos = computed(() =>
  hasThrough.value ? props.bend.from + props.bend.through![0] : undefined,
);

const upswingTo = computed(() => throughPos.value ?? props.bend.to);

const isPrebend = computed(() => props.bend.from === props.bend.to);

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
  <OverlayCoords
    v-slot="{
      toCoords: c,
      resizeObserver: { getStackCoords, getNextStackPos },
    }"
    :tabline-start
    :tabline-last
  >
    <g
      v-if="getStackCoords(props.bend.from) && getStackCoords(props.bend.to)"
      :class="`bend-${bend.from}-${bend.to}-s${bend.string}`"
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

      <rect
        class="upswing-dragger"
        :x="c(upswingTo).left"
        :y="0"
        :width="c(upswingTo).right - c(upswingTo).left"
        :height="cellHeight * 1.5"
        opacity="0"
        @mousedown="bendEditState.start('upswing', props.bend)"
        @mouseover="upswingArrowHover = true"
        @mouseleave="upswingArrowHover = false"
      />

      <foreignObject
        v-if="!hasThrough || c(throughPos!).left <= c(tablineLast).left"
        :x="c(upswingTo).left - 1.3 * (c(upswingTo).right - c(upswingTo).left)"
        :y="0"
        :width="3 * (c(upswingTo).right - c(upswingTo).left)"
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
        :d="
          isPrebend
            ? `M ${c(bend.from).center} ${startY - cellHeight * 0.85} V ${cellHeight * 0.75}`
            : `M ${(c(bend.from).right + c(bend.from).center) / 2} ${startY - cellHeight * 0.6} 
               Q ${c(upswingTo).center} ${startY - cellHeight * 0.55} ${c(upswingTo).center} ${cellHeight * 0.75}`
        "
        :marker-end="upswingArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
      />

      <g v-if="hasThrough">
        <path
          v-if="bend.releaseType === 'connect'"
          class="downswing-curve"
          :d="`M ${c(throughPos!).right} ${cellHeight * 0.35}
               Q ${c(bend.to).center} ${cellHeight * 0.35} ${c(bend.to).center} ${startY - cellHeight * 0.95}`"
          :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
        />
        <line
          v-else
          class="hold-line"
          :x1="c(throughPos!).right"
          :x2="c(bend.to).center"
          :y1="cellHeight * 0.35"
          :y2="cellHeight * 0.35"
          :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : undefined"
        />
      </g>

      <g v-if="!bendEditState.dragging">
        <rect
          class="release-grabber"
          :x="hasThrough ? c(bend.to).left : c(bend.to).right"
          :y="
            hasThrough && bend.releaseType === 'connect'
              ? startY - cellHeight * 1.5
              : 0
          "
          :width="c(bend.to).right - c(bend.to).left"
          :height="cellHeight"
          opacity="0"
          @mousedown="bendEditState.start('release', props.bend)"
          @click="
            bendEditState.onReleaseGrabberClick(getNextStackPos(bend.to)!)
          "
          @mouseover="releaseArrowHover = true"
          @mouseleave="releaseArrowHover = false"
        />
        <line
          v-if="!hasThrough"
          :x1="c(bend.to).right"
          :y1="cellHeight * 0.35"
          :x2="c(getNextStackPos(bend.to)!).center"
          :y2="cellHeight * 0.35"
          stroke="black"
          opacity="0.4"
          :marker-end="'url(#arrow)'"
        />
      </g>
    </g>
  </OverlayCoords>
</template>

<style scoped>
.upswing-curve,
.downswing-curve,
.hold-line {
  stroke-width: 1;
  stroke: black;
  fill: none;
}

.bend-label {
  display: grid;
  justify-content: center;
  align-items: end;
  /* justify-content: center; */
  width: 120%;
  &:not(.dragging) {
    select:hover + span {
      background-color: lightgray;
    }
  }

  & span {
    /* align-self: start; */
    font-size: calc(var(--note-font-size) * 0.75);
    cursor: text;
    padding: 0px 7px;
    margin-bottom: 2px;
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
    color: transparent;
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
