<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import { injectStackResizeObserver } from "~/components/tab/providers/events/provide-resize-observer";
import { injectBendEditState } from "@/components/tab/providers/state/provide-bend-edit-state";
import OverlayCoords from "../OverlayCoords.vue";
import OverlaySelect from "../OverlaySelect.vue";
import { injectOverlayControlsTeleport } from "../provide-overlay-controls-teleport";
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import { injectEditingState } from "~/components/tab/providers/state/provide-editing-state";

export interface BendRenderProps {
  bend: Bend;
}

const props = defineProps<BendRenderProps>();
const bendEditState = injectBendEditState();
const { overlayControlsSelector } = injectOverlayControlsTeleport();
const { editingNote } = injectEditingState();

const { getNextStackPos } = injectStackResizeObserver();

const startRow = computed(() => props.bend.string + 2);

const hasThrough = computed(() => !!props.bend.through?.length);
const throughPos = computed(() =>
  hasThrough.value ? props.bend.from + props.bend.through![0] : undefined,
);

const upswingToPos = computed(() => throughPos.value ?? props.bend.to);

const isPrebend = computed(() => props.bend.from === props.bend.to);

const options: Array<[value: number, label: string]> = [
  [0.5, "&half;"],
  [1, "full"],
  [1.5, "1&half;"],
];

const model = defineModel({
  get() {
    return props.bend.bend;
  },
  set(value) {
    bendEditState.setBendValue(props.bend, value as number);
  },
});

const labelHover = ref(false);
const selectActive = computed(() => {
  if (labelHover.value) return true;
  if (editingNote.value) {
    if (
      editingNote.value.string === props.bend.string &&
      [props.bend.from, props.bend.to].includes(editingNote.value.position)
    )
      return true;
  }
  return false;
});

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
        @mouseover="bendEditState.onLabelHover"
      >
        <!-- <select ref="select" @input="onSelectInput">
            <option
              v-for="[bendBy, label] in Object.entries(bendLabels).sort(
                (a, b) => +a[0] - +b[0],
              )"
              :value="bendBy"
              :selected="props.bend.bend === +bendBy"
              v-html="label"
            />
            <option value="delete">&Cross;</option>
          </select> -->
      </foreignObject>

      <Teleport :to="overlayControlsSelector">
        <foreignObject
          :x="upswingTo.left"
          :y="-3"
          :width="100"
          :height="200"
          overflow="visible"
        >
          <div
            class="select-container"
            :style="{
              width: `${upswingTo.right - upswingTo.left}px`,
              display: 'flex',
              justifyContent: 'center',
            }"
          >
            <OverlaySelect
              v-model="model"
              :active="selectActive"
              :options
              class="select"
              @mouseenter="labelHover = true"
              @mouseleave="labelHover = false"
              @delete-clicked="bendEditState.deleteBend(props.bend)"
            />
          </div>
        </foreignObject>
      </Teleport>

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
