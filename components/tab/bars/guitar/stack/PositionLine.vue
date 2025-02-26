<script lang="ts" setup>
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import { injectTabBarBounds } from "../../provide-bar-bounds";
import { SPACING, type ColoredSpacingName } from "~/composables/theory";

const props = defineProps<{
  position: number;
  fillIntersection: boolean;
}>();

const cellHoverState = injectCellHoverEvents();
const settings = injectSettingsState();
const tabBarBounds = injectTabBarBounds();

const smallestSpacing = computed(() => 1 / settings.subdivisions);

const isQuarterNote = computed(() => {
  const currentSpacing = largestSpacingDivisor(props.position)!;
  return currentSpacing === "Quarter";
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

const colors: Record<ColoredSpacingName, string> = {
  Quarter: "var(--quarter-note-color)",
  Eighth: "var(--eighth-note-color)",
  Sixteenth: "var(--sixteenth-note-color)",
  ThirtySecond: "var(--thirty-second-note-color)",
  SixtyFourth: "var(--sixty-fourth-note-color)",
  OneTwentyEighth: "var(--one-twenty-eighth-note-color)",
};

const spacingColor = computed(() => {
  // if (isQuarterNote.value) {
  //   return "var(--quarter-note-color)";
  // }
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
    return colors[currentSpacing];
  }
  const hoveredPosition = cellHoverState.hoveredNote?.value?.position;
  if (!hoveredPosition) {
    return false;
  }
  const hoveredSpacing = largestSpacingDivisor(hoveredPosition)!;
  if (isHoveredSpacing.value) {
    return colors[hoveredSpacing];
  }
  return false;
});

const lineColor = computed(() => spacingColor.value || "var(--pos-line-color)");
const isThick = computed(() => isQuarterNote.value || spacingColor.value);
</script>

<template>
  <template v-if="settings.posLineCenter">
    <div
      class="pos-line top"
      :class="{
        'is-thick': isThick,
        'is-quarter': isQuarterNote,
      }"
      :style="{ backgroundColor: lineColor }"
    />
    <div
      class="pos-line bottom"
      :class="{
        'is-thick': isThick,
        'is-quarter': isQuarterNote,
      }"
      :style="{ backgroundColor: lineColor }"
    />

    <div
      v-if="fillIntersection"
      class="fill-intersection"
      :class="{
        'is-thick': isThick,
        'is-quarter': isQuarterNote,
      }"
      :style="{ backgroundColor: lineColor }"
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

.is-quarter {
  opacity: 1;
}

.is-thick {
  width: calc(var(--pos-line-width) + 1px);
}

@container (aspect-ratio < 0.45) {
  .pos-line {
    display: none;
  }
}
</style>
