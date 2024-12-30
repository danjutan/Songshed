<script lang="ts" setup>
import OverlaySelect from "../OverlaySelect.vue";
import type { Tie } from "~/model/stores";
import { injectEditTie } from "./provide-edit-tie";
import type { TieType } from "~/model/data";

const props = defineProps<{
  active: boolean;
  tie: Tie;
  x: number;
  y: number;
}>();

const { updateType, deleteTie } = injectEditTie();
const isHovered = ref(false);

const values: Record<string, TieType> = {
  hammer: { hammer: true },
  slide: { slide: true },
  "hammer-slide": { hammer: true, slide: true },
};
type Value = keyof typeof values;

const options = computed<[Value, string][]>(() => {
  const connected =
    props.tie.midiFrom !== undefined && props.tie.midiTo !== undefined;
  const ascending = !connected || props.tie.midiFrom! < props.tie.midiTo!;
  const hammerChar = ascending ? "H" : "P";
  const slideChar = ascending ? "/" : "\\";
  return [
    ["hammer", hammerChar],
    ["slide", slideChar],
    ["hammer-slide", hammerChar + slideChar],
  ];
});

const model = defineModel({
  get() {
    if (props.tie.type.hammer && props.tie.type.slide) {
      return "hammer-slide";
    } else if (props.tie.type.hammer) {
      return "hammer";
    } else {
      return "slide";
    }
  },
  set(value) {
    updateType(props.tie, values[value as Value]);
  },
});
</script>

<template>
  <Teleport to=".overlay-controls">
    <foreignObject :x :y :width="50" height="1000">
      <OverlaySelect
        v-model="model"
        class="select"
        :class="{ inactive: !active }"
        :placeholder="'H'"
        :options
        :override-display="active || isHovered ? {} : { 'hammer-slide': 'H' }"
        @delete-clicked="deleteTie(tie)"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @option-selected="isHovered = false"
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
</style>
