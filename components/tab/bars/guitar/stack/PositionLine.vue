<script lang="ts" setup>
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import { injectTabBarBounds } from "../../provide-bar-bounds";
import { injectTimeSignature } from "~/components/tab/providers/provide-time-signature";
import {
  SPACING,
  largestSpacingDivisor,
  type ColoredSpacingName,
} from "~/theory/spacing";

const props = defineProps<{
  position: number;
  fillIntersection: boolean;
}>();

const cellHoverState = injectCellHoverEvents();
const settings = injectSettingsState();
const tabBarBounds = injectTabBarBounds();
const { getTimeSignatureAt } = injectTimeSignature();

const timeSignature = computed(() => getTimeSignatureAt(props.position));

const beatSize = computed(() => timeSignature.value.beatSize);

const smallestSpacing = computed(() => beatSize.value / settings.subdivisions);

const isBeatSpacing = computed(() => {
  return props.position % beatSize.value === 0;
});

const hoveredInBar = computed(() => {
  const hoveredPosition = cellHoverState.hoveredNote?.value?.position;
  if (!hoveredPosition) {
    return false;
  }
  return (
    tabBarBounds.start <= hoveredPosition && hoveredPosition < tabBarBounds.end
  );
});

const isHoveredSpacing = computed(() => {
  const hoveredPosition = cellHoverState.hoveredNote?.value?.position;
  if (!hoveredPosition || !cellHoverState.debounced.value) {
    return false;
  }
  const hoveredSpacing = largestSpacingDivisor(hoveredPosition)!;
  if (
    !settings.colorSmallest &&
    SPACING[hoveredSpacing] === smallestSpacing.value
  ) {
    return false;
  }
  return props.position % SPACING[hoveredSpacing] === 0;
});

// If beatSize is Eighth, eigth notes will use the quarter note color etc
const colors: string[] = [
  "var(--quarter-note-color)",
  "var(--eighth-note-color)",
  "var(--sixteenth-note-color)",
  "var(--thirty-second-note-color)",
  "var(--sixty-fourth-note-color)",
  "var(--one-twenty-eighth-note-color)",
];

function getRelativeColorIndex(spacingValue: number): number {
  const ratio = spacingValue / beatSize.value;
  const thresholds = [1, 0.5, 0.25, 0.125, 0.0625];
  return thresholds.findIndex((threshold) => ratio == threshold);
}

function getColor(spacing: ColoredSpacingName): string {
  return colors[getRelativeColorIndex(SPACING[spacing])];
}

const spacingColor = computed(() => {
  if (
    !settings.colorPositions ||
    (settings.onlyColorBar && !hoveredInBar.value)
  ) {
    return false;
  }
  if (settings.colorPositions === "always") {
    const currentSpacing = largestSpacingDivisor(props.position)!;
    if (!currentSpacing) {
      return false;
    }
    if (
      !settings.colorSmallest &&
      SPACING[currentSpacing] === smallestSpacing.value
    ) {
      return false;
    }
    return getColor(currentSpacing);
  }
  const hoveredPosition = cellHoverState.hoveredNote?.value?.position;
  if (!hoveredPosition) {
    return false;
  }
  const hoveredSpacing = largestSpacingDivisor(hoveredPosition)!;
  if (isHoveredSpacing.value) {
    if (settings.colorPositions === "gray") {
      if (isBeatSpacing.value) {
        return getColor("Quarter");
      }
      return "var(--gray-note-color)";
    }
    return getColor(hoveredSpacing);
  }
  return false;
});

const lineColor = computed(() => spacingColor.value || "var(--pos-line-color)");
const isThick = computed(() => isBeatSpacing.value || spacingColor.value);
const isOpaque = computed(
  () => isBeatSpacing.value && settings.colorPositions !== "always",
);

const classes = computed(() => ({
  "is-thick": isThick.value,
  "is-opaque": isOpaque.value,
}));

const style = computed(() => ({
  backgroundColor: lineColor.value,
}));
</script>

<template>
  <template v-if="settings.posLineCenter">
    <!-- Allows us to easily apply a transition deep inside the stack, but doesn't allow a leave transition-->
    <ClientOnly>
      <Transition appear>
        <div class="pos-line top" :class="classes" :style />
      </Transition>
      <Transition appear>
        <div class="pos-line bottom" :class="classes" :style />
      </Transition>
    </ClientOnly>
    <div
      v-if="fillIntersection"
      class="fill-intersection"
      :class="classes"
      :style
    />
  </template>
</template>

<style scoped>
.pos-line {
  width: var(--pos-line-width);
  z-index: var(--pos-line-z-index);
  height: 100%;
  justify-self: center;
}

.pos-line.top {
  grid-area: 1 / 2;
}

.pos-line.bottom {
  grid-area: 3 / 2;
}

.fill-intersection {
  grid-area: 2 / 2;
  width: var(--pos-line-width);
  height: 1px;
}

.pos-line,
.fill-intersection {
  transition: background-color 0.15s ease;
  opacity: var(--pos-line-alpha);
}

.is-opaque {
  opacity: 1;
}

.is-thick {
  width: calc(var(--pos-line-width) + 1px);
}

.v-enter-active {
  transition: opacity 0.15s ease;
}

.v-enter-from {
  opacity: 0;
}

@container (aspect-ratio < 0.45) {
  .pos-line {
    display: none;
  }
}
</style>
