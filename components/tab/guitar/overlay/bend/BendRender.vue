<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import { injectStackResizeObserver } from "@/components/tab/events/provide-resize-observer";
import {
  BendEditInjectionKey,
  type BendEditState,
} from "../state/provide-bend-edit-state";
import OverlayCoords from "../OverlayCoords.vue";

export interface BendRenderProps {
  bend: Bend;
}

const props = defineProps<BendRenderProps>();
const bendEditState = inject(BendEditInjectionKey) as BendEditState;

const { getNextStackPos } = injectStackResizeObserver();

const startRow = computed(() => props.bend.string + 2);

const hasThrough = computed(() => !!props.bend.through?.length);
const throughPos = computed(() =>
  hasThrough.value ? props.bend.from + props.bend.through![0] : undefined,
);

const upswingToPos = computed(() => throughPos.value ?? props.bend.to);

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
    v-slot="{ coords: [from, to, upswingTo, through, afterTo], cellHeight }"
    :positions="[
      props.bend.from,
      props.bend.to,
      upswingToPos,
      throughPos,
      getNextStackPos(props.bend.to),
    ]"
  >
    <g
      v-if="from && to && upswingTo"
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
        :x="upswingTo.left"
        :y="0"
        :width="upswingTo.right - upswingTo.left"
        :height="cellHeight * 1.5"
        opacity="0"
        @mousedown="bendEditState.start('upswing', props.bend)"
        @mouseover="upswingArrowHover = true"
        @mouseleave="upswingArrowHover = false"
      />

      <foreignObject
        v-if="!through || through.left <= to.left"
        :x="upswingTo.left - 1.3 * (upswingTo.right - upswingTo.left)"
        :y="0"
        :width="3 * (upswingTo.right - upswingTo.left)"
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
            ? `M ${from.center} ${(startRow - 0.85) * cellHeight} V ${cellHeight * 0.75}`
            : `M ${(from.right + from.center) / 2} ${(startRow - 0.6) * cellHeight} 
               Q ${upswingTo.center} ${(startRow - 0.55) * cellHeight} ${upswingTo.center} ${cellHeight * 0.75}`
        "
        :marker-end="upswingArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
      />

      <g v-if="through">
        <path
          v-if="bend.releaseType === 'connect'"
          class="downswing-curve"
          :d="`M ${through.right} ${cellHeight * 0.35}
               Q ${to.center} ${cellHeight * 0.35} ${to.center} ${(startRow - 0.95) * cellHeight}`"
          :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
        />
        <line
          v-else
          class="hold-line"
          :x1="through.right"
          :x2="to.center"
          :y1="cellHeight * 0.35"
          :y2="cellHeight * 0.35"
          :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : undefined"
        />
      </g>

      <g v-if="!bendEditState.dragging">
        <rect
          class="release-grabber"
          :x="hasThrough ? to.left : to.right"
          :y="
            hasThrough && bend.releaseType === 'connect'
              ? (startRow - 1.5) * cellHeight
              : 0
          "
          :width="to.right - to.left"
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
          v-if="!hasThrough && afterTo"
          :x1="to.right"
          :y1="cellHeight * 0.35"
          :x2="afterTo.center"
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
