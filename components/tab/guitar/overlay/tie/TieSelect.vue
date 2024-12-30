<script lang="ts" setup>
import OverlaySelect from "../OverlaySelect.vue";
import type { Tie } from "~/model/stores";
import { injectEditTie } from "./provide-edit-tie";
import { TieType } from "~/model/data";

const props = defineProps<{
  active: boolean;
  tie: Tie;
  x: number;
  y: number;
}>();

const { updateType, deleteTie } = injectEditTie();

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
</script>

<template>
  <Teleport to=".overlay-controls">
    <foreignObject :x :y :width="55" height="1000">
      <OverlaySelect
        v-model="model"
        class="select"
        :class="{ inactive: !active }"
        :placeholder="'H'"
        :options
        :override-display="{ [TieType.Slide]: '', [TieType.TieSlide]: '' }"
        @delete-clicked="deleteTie(tie)"
      />
    </foreignObject>
  </Teleport>
</template>

<style scoped>
.inactive:not(:hover) {
  --vs-input-bg: transparent;
  --vs-input-outline: transparent;
  --vs-border: 1px solid transparent;

  &:deep(.indicators-container) {
    display: none;
  }

  &:deep(.control) {
    width: 10px;
  }
}

.select {
  &:deep(.tie-slide) {
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
}
</style>
