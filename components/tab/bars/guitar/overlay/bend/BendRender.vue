<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import { injectStackResizeObserver } from "~/components/tab/providers/events/provide-resize-observer";
import { injectBendEditState } from "~/components/tab/providers/state/provide-bend-edit-state";
import OverlayCoords from "~/components/tab/bars/OverlayCoords.vue";
import OverlaySelect from "../OverlaySelect.vue";
import { injectOverlayControlsTeleport } from "../../provide-overlay-controls-teleport";
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import { injectEditingState } from "~/components/tab/providers/state/provide-editing-state";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import BendDragger from "./BendDragger.vue";
import { injectSpacingsState } from "~/components/tab/providers/provide-spacings";

const props = defineProps<{
  bend: Bend;
  showLabel: boolean;
}>();

const bendEditState = injectBendEditState();
const { selectsSelector } = injectOverlayControlsTeleport();
const { editingNote } = injectEditingState();
const { getNextStackPos } = injectStackResizeObserver();

const { contextMenuHeight, cellHeight, dividerWidth } = injectSpacingsState();

const startRowTop = computed(() => contextMenuHeight.value + cellHeight.value);

const startRow = computed(() => props.bend.string + 1);

const hasThrough = computed(() => !!props.bend.through?.length);
const throughPos = computed(() =>
  hasThrough.value ? props.bend.from + props.bend.through![0] : undefined,
);

const upswingToPos = computed(() => throughPos.value ?? props.bend.to);
const upswingToY = contextMenuHeight.value / 3;

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

const dragging = bendEditState.dragging;

// onUnmounted(() => {
//   console.log("bend unmounted");
// });
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to, upswingTo, through, afterTo] }"
    :offset="dividerWidth"
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
        fill="var(--bend-color)"
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
        fill="var(--bend-color)"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <BendDragger
        :bend="props.bend"
        :mode="'upswing'"
        :x="upswingTo.left"
        :y="upswingToY + contextMenuHeight"
        :width="upswingTo.right - upswingTo.left"
        :height="cellHeight"
        @mouseenter="upswingArrowHover = true"
        @mouseleave="upswingArrowHover = false"
      />

      <foreignObject>
        <Teleport :to="selectsSelector">
          <div
            v-if="showLabel"
            :style="{
              position: 'absolute',
              width: `${upswingTo.right - upswingTo.left}px`,
              left: `${upswingTo.left}px`,
              top: `${upswingToY - 2}px`,
              display: 'flex',
              justifyContent: 'center',
            }"
          >
            <OverlaySelect
              v-model="model"
              :active="selectActive"
              :options
              class="select"
              :pointer-events-none="dragging"
              @mouseenter="labelHover = true"
              @mouseleave="labelHover = false"
              @delete-clicked="bendEditState.deleteBend(props.bend)"
            />
          </div>
        </Teleport>
      </foreignObject>

      <path
        class="upswing-curve"
        :d="
          isPrebend
            ? `M ${from.center} ${startRowTop + (startRow - 0.85) * cellHeight} V ${upswingToY + cellHeight * 0.83}`
            : `M ${from.right} ${startRowTop + (startRow - 0.6) * cellHeight} 
               Q ${upswingTo.center} ${startRowTop + (startRow - 0.55) * cellHeight} ${upswingTo.center} ${upswingToY + cellHeight * 0.83}`
        "
        :marker-end="upswingArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
      />

      <g v-if="through">
        <path
          v-if="bend.releaseType === 'connect'"
          class="downswing-curve"
          :d="`M ${through.right} ${upswingToY + cellHeight * 0.35}
               Q ${to.center} ${upswingToY + cellHeight * 0.35} ${to.center} ${startRowTop + (startRow - 0.95) * cellHeight}`"
          :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
        />
        <line
          v-else
          class="hold-line"
          :x1="through.right"
          :x2="to.center"
          :y1="upswingToY + cellHeight * 0.35"
          :y2="upswingToY + cellHeight * 0.35"
          :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : undefined"
        />
      </g>

      <g v-if="!dragging">
        <BendDragger
          :bend="props.bend"
          :mode="'release'"
          :x="hasThrough ? to.left : to.right"
          :y="
            hasThrough && bend.releaseType === 'connect'
              ? startRowTop + (startRow - 1.5) * cellHeight
              : upswingToY
          "
          :width="to.right - to.left"
          :height="contextMenuHeight"
          @click="
            bendEditState.onReleaseGrabberClick(bend, getNextStackPos(bend.to)!)
          "
          @mouseenter="releaseArrowHover = true"
          @mouseleave="releaseArrowHover = false"
        />
        <line
          v-if="
            !hasThrough &&
            (releaseArrowHover || upswingArrowHover || labelHover) &&
            afterTo
          "
          :x1="to.right"
          :y1="upswingToY + cellHeight * 0.35"
          :x2="afterTo.center"
          :y2="upswingToY + cellHeight * 0.35"
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
.hold-line,
line {
  stroke-width: 1;
  stroke: var(--bend-color);
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
