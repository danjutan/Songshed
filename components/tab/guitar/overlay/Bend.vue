<script lang="ts" setup>
import type { Bend } from "~/model/stores";
import {
  type StackCoords,
  ResizeObserverInjectionKey,
  type ResizeObserver,
  withOffset,
} from "../../state/resize-observer";
import {
  SettingsInjectionKey,
  type Settings,
} from "../../state/settings-state";

const { getStackCoords, getPreviousStackPos, getNextStackPos } = inject(
  ResizeObserverInjectionKey,
) as ResizeObserver;
const settingState = inject(SettingsInjectionKey) as Settings;
const cellHeight = computed(() => parseInt(settingState.cellHeight));

const props = defineProps<{
  bend: Bend;
  tablineStart: number;
  tablineLast: number;
}>();

const prebend = computed(() => props.bend.from === props.bend.to);
const throughPoint = computed(() =>
  props.bend.through?.length ? props.bend.through[0] : undefined,
);

const isRightHalf = computed(() => props.bend.from < props.tablineStart);
const isLeftHalf = computed(() => props.bend.to > props.tablineLast);

const lastLineEnd = computed(
  () => getStackCoords(getPreviousStackPos(props.tablineStart)!)!.right,
);

const nextLineStart = computed(
  () => getStackCoords(getNextStackPos(props.tablineLast)!)!.left,
);

const fromCoords = computed(() => {
  const coords = getStackCoords(props.bend.from);
  if (!coords) return;
  if (isRightHalf.value) {
    // WARNING: this technique won't work if we need to render a tabline independently / if the bend starts off-screen
    // TODO: in that case just use the current tabline as reference
    const offset = coords.left - lastLineEnd.value; // will be negative
    return withOffset(getStackCoords(props.tablineStart)!, offset);
  }
  return getStackCoords(props.bend.from);
});

const toCoords = computed(() => {
  const coords = getStackCoords(props.bend.to);
  if (!coords) return;
  if (isLeftHalf.value) {
    const offset = coords.right - nextLineStart.value; // will be positive;
    return withOffset(getStackCoords(props.tablineLast)!, offset);
  }
  return coords;
});

const throughCoords = computed<StackCoords | undefined>(() => {
  if (!throughPoint.value || !fromCoords.value) return;
  const coords = withOffset(
    getStackCoords(throughPoint.value!)!,
    fromCoords.value.left,
  );
  if (!coords) return;
  if (isRightHalf.value) {
    if (throughPoint.value < props.tablineStart) {
      const offset = coords.left - lastLineEnd.value; // will be negative
      return withOffset(getStackCoords(props.tablineStart)!, offset);
    }
  }
  if (isLeftHalf.value) {
    if (throughPoint.value > props.tablineLast) {
      const offset = coords.right - nextLineStart.value; // will be positive;
      return withOffset(getStackCoords(props.tablineLast)!, offset);
    }
  }
  return coords;
});

const upswingToCoords = computed(() => {
  return throughCoords.value || toCoords.value;
});

const startY = computed(() => {
  return cellHeight.value * (props.bend.string + 2);
});

const upswingPath = computed(() => {
  if (!fromCoords.value || !upswingToCoords.value) return;
  const { left, center, right } = fromCoords.value;
  const sy = startY.value,
    ch = cellHeight.value,
    ux = upswingToCoords.value.center;

  if (prebend.value) {
    return `M ${center} ${sy - ch * 0.85}` + `V ${ch * 0.75} `;
  }

  return (
    `M ${(right + center) / 2} ${sy - ch * 0.6} ` +
    `Q ${ux} ${sy - ch * 0.55} ${ux} ${ch * 0.75}`
  );
});

const releasePath = computed(() => {
  if (!throughCoords.value || !toCoords.value) return;
  const ch = cellHeight.value;
  return (
    `M ${throughCoords.value.right} ${ch * 0.35} ` +
    `Q ${toCoords.value.center} ${ch * 0.35} ${toCoords.value.center} ${startY.value - ch * 0.95}`
  );
});

const upswingArrowHover = ref(false);
const releaseArrowHover = ref(false);
</script>

<template>
  <g :class="`bend-${bend.from}-${bend.to}-s${bend.string}`">
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
    <g v-if="throughCoords">
      <path
        v-if="bend.releaseType === 'connect'"
        class="downswing-curve"
        :d="releasePath"
        :marker-end="releaseArrowHover ? 'url(#hover-arrow)' : 'url(#arrow)'"
      />
      <line
        v-else
        class="hold-line"
        :x1="throughCoords.right"
        :x2="toCoords!.center"
        :y1="cellHeight * 0.35"
        :y2="cellHeight * 0.35"
      />
    </g>
  </g>
</template>

<style scoped>
.upswing-curve,
.downswing-curve,
.hold-line {
  stroke: red;
  stroke-width: 2;
  fill: none;
  /* vector-effect: non-scaling-stroke; */
}
</style>
