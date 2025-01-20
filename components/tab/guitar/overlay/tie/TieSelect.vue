<script lang="ts" setup>
import OverlaySelect from "../OverlaySelect.vue";
import type { Tie } from "~/model/stores";
import { injectEditTie } from "./provide-edit-tie";
import { TieType } from "~/model/data";
import { injectOverlayControlsTeleport } from "../provide-overlay-controls-teleport";

const props = defineProps<{
  active: boolean;
  tie: Tie;
  x: number;
  y: number;
}>();

const { updateType, deleteTie } = injectEditTie();
const { overlayControlsSelector } = injectOverlayControlsTeleport();

const options = computed<[TieType, string][]>(() => {
  const connected =
    props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined;
  const ascending = !connected || props.tie.midiFrom! < props.tie.midiTo!;
  const hammerChar = ascending ? "H" : "P";
  const slideChar = ascending ? "&#x27CB;" : "&#x27CD;";
  const tieSlideChar = `<span class="tie-slide">
    <span class="tie">&smile;</span>
    <span class="slide">${slideChar}</span>
  </span>`;
  return [
    [TieType.Hammer, hammerChar],
    [TieType.Slide, slideChar],
    [TieType.TieSlide, tieSlideChar],
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
</script>

<template>
  <Teleport :to="overlayControlsSelector">
    <foreignObject :x="x" :y :width="55" :height="200" overflow="visible">
      <OverlaySelect
        v-model="model"
        :active
        :options
        :override-display="{ [TieType.Slide]: '', [TieType.TieSlide]: '' }"
        @delete-clicked="deleteTie(tie)"
        @mouseenter="$emit('mouseenter')"
        @mouseleave="$emit('mouseleave')"
      />
    </foreignObject>
  </Teleport>
</template>

<style scoped>
foreignObject {
  /* uncomment this and try hovering from below */
  /* opacity: 0.8; */
}
.select :deep(.tie-slide) {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  transform: translateY(-10%);
  & .tie {
    font-size: 100%;
    display: block;
    grid-column: 1 / 1;
    grid-row: 1 / 1;
    transform: translateY(80%);
  }

  & .slide {
    font-size: 90%;
    grid-column: 1 / 1;
    grid-row: 1 / 1;
  }
}
</style>
