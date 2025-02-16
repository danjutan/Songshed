<script lang="ts" setup>
import OverlaySelect from "../OverlaySelect.vue";
import type { Tie } from "~/model/stores";
import { injectEditTie } from "../../provide-edit-tie";
import { TieType } from "~/model/data";
import { injectOverlayControlsTeleport } from "../../provide-overlay-controls-teleport";

const props = defineProps<{
  active: boolean;
  tie: Tie;
  x: number;
  y: number;
  hide?: boolean;
}>();

const { updateType, deleteTie } = injectEditTie();
const { selectsSelector } = injectOverlayControlsTeleport();

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
<style>
.tie-slide {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  transform: translateY(-10%);
  & .tie {
    font-size: 120%;
    display: block;
    grid-column: 1 / 1;
    grid-row: 1 / 1;
    transform: translateY(60%);
  }

  & .slide {
    font-size: 90%;
    grid-column: 1 / 1;
    grid-row: 1 / 1;
  }
}
</style>
