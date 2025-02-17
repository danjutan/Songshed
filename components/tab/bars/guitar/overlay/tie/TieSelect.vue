<script lang="ts" setup>
import OverlaySelect from "../OverlaySelect.vue";
import type { Tie } from "~/model/stores";
import { injectEditTie } from "../../provide-edit-tie";
import { TieType } from "~/model/data";
import { injectOverlayControlsTeleport } from "../../provide-overlay-controls-teleport";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";

const props = defineProps<{
  active: boolean;
  tie: Tie;
  x: number;
  y: number;
  hide?: boolean;
}>();

const { updateType, deleteTie } = injectEditTie();
const { selectsSelector } = injectOverlayControlsTeleport();

const settings = injectSettingsState();
const iconSizePx = computed(() => `${(settings.cellHeight * 2) / 3}px`);

function tieSlideCurvePath() {
  const x1 = 0;
  const x2 = 10;
  const y = 7.5;
  const bottom = 9;
  const curvePointX = (x2 + x1) / 2;
  const controlY = 2 * bottom - y; // from the derivative of the quadratic Bezier curve
  const pathData = `
    M ${x1},${y}
    Q ${curvePointX},${controlY - 1} ${x2},${y}
    Q ${curvePointX},${controlY + 1} ${x1},${y}
    Z`;
  return pathData;
}

const options = computed<[TieType, string][]>(() => {
  const connected =
    props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined;
  const ascending = !connected || props.tie.midiFrom! < props.tie.midiTo!;
  const hammerChar = ascending ? "H" : "P";
  const slideLine = (yStart: number) =>
    ascending
      ? `<line x1="1" y1="${yStart + 6}" x2="9" y2="${yStart + 2}" stroke="currentColor" stroke-width="0.5" />`
      : `<line x1="1" y1="${yStart + 2}" x2="10" y2="${yStart + 6}" stroke="currentColor" stroke-width="0.5" />`;

  const slideIcon = `<svg class="slide" width="${iconSizePx.value}" height="${iconSizePx.value}" viewBox="0 0 10 10">
    ${slideLine(2)}
  </svg>`;

  const tieSlideIcon = `<svg class="tie-slide" width="${iconSizePx.value}" height="${iconSizePx.value}" viewBox="0 0 10 10">
    ${slideLine(0)}
    <path fill="currentColor" d="${tieSlideCurvePath()}" />
  </svg>`;

  return [
    [TieType.Hammer, hammerChar],
    [TieType.Slide, slideIcon],
    [TieType.TieSlide, tieSlideIcon],
    [TieType.Tap, "T"],
  ];
});

const model = defineModel({
  get() {
    return props.tie.type;
  },
  set(value) {
    updateType(props.tie, value as TieType);
  },
});

const emits = defineEmits<{
  mouseenter: [];
  mouseleave: [];
}>();

const left = computed(() => props.x + "px");
const top = computed(() => props.y + "px");
</script>

<template>
  <foreignObject>
    <Teleport :to="selectsSelector">
      <div class="tie-select">
        <OverlaySelect
          v-model="model"
          :active
          :hide
          :options
          :override-display="{ [TieType.Slide]: '', [TieType.TieSlide]: '' }"
          @delete-clicked="deleteTie(tie)"
          @mouseenter="$emit('mouseenter')"
          @mouseleave="$emit('mouseleave')"
        />
      </div>
    </Teleport>
  </foreignObject>
</template>

<style scoped>
.tie-select {
  position: absolute;
  left: v-bind(left);
  top: v-bind(top);
}
</style>
