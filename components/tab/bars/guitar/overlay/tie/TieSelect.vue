<script lang="ts" setup>
import OverlaySelect from "../OverlaySelect.vue";
import type { Tie } from "~/model/stores";
import { injectEditTie } from "../../provide-edit-tie";
import { TIE_TYPE, type TieType } from "~/model/data";
import { injectOverlayControlsTeleport } from "../../provide-overlay-controls-teleport";
import { injectSpacingsState } from "~/components/tab/providers/provide-spacings";
import {
  useCoordsDirective,
  type ValueFn,
} from "~/components/tab/hooks/use-coords-directive";

const props = defineProps<{
  active: boolean;
  tie: Tie;
  fromPos: number;
  toPos: number;
  leftValue: ValueFn<"from" | "to">;
  topValue: ValueFn<"from" | "to">;
  hide?: boolean;
}>();

const { updateType, deleteTie } = injectEditTie();
const { selectsSelector } = injectOverlayControlsTeleport();

const { cellHeight } = injectSpacingsState();

const vCoords = useCoordsDirective({
  from: computed(() => props.fromPos),
  to: computed(() => props.toPos),
});

function tieSlideCurvePath() {
  const x1 = 0;
  const x2 = 20;
  const y = 7;
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

  const svgWrapper = (icon: string) =>
    `<svg width="20px" height="10px" viewBox="0 0 20 10">${icon}</svg>`;

  const slideLine = (yStart: number) =>
    ascending
      ? `<line x1="1" y1="${yStart + 6}" x2="19" y2="${yStart + 2}" stroke="currentColor" stroke-width="0.5" />`
      : `<line x1="1" y1="${yStart + 2}" x2="20" y2="${yStart + 6}" stroke="currentColor" stroke-width="0.5" />`;

  const slideIcon = svgWrapper(`${slideLine(2)}`);
  const tieSlideIcon = svgWrapper(
    `${slideLine(0)}<path fill="currentColor" d="${tieSlideCurvePath()}" />`,
  );
  const plainIcon = svgWrapper(
    `<path fill="currentColor" d="${tieSlideCurvePath()}" />`,
  );

  return [
    [TIE_TYPE.Plain, plainIcon],
    [TIE_TYPE.Hammer, hammerChar],
    [TIE_TYPE.Slide, slideIcon],
    [TIE_TYPE.TieSlide, tieSlideIcon],
    [TIE_TYPE.Tap, "T"],
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
</script>

<template>
  <foreignObject>
    <Teleport :to="selectsSelector">
      <div v-coords:left="leftValue" v-coords:top="topValue" class="tie-select">
        <OverlaySelect
          v-model="model"
          :active
          :hide
          :options
          :override-display="{
            [TIE_TYPE.Plain]: '',
            [TIE_TYPE.Slide]: '',
            [TIE_TYPE.TieSlide]: '',
          }"
          show-clear
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
}
</style>
