<script lang="ts" setup>
import type { Tie } from "~/model/stores";
import { useTiePath } from "./use-tie-path";
import {
  SettingsInjectionKey,
  type Settings,
} from "~/components/tab/state/settings-state";
import OverlayCoords from "../OverlayCoords.vue";

const props = withDefaults(defineProps<{ tie: Tie; firstRow: number }>(), {
  firstRow: 1,
});
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [from, to], cellHeight }"
    :positions="[tie.from, tie.to]"
  >
    <svg v-if="from && to">
      <path
        :d="
          useTiePath(
            (from.center + from.right) / 2,
            (to.center + to.left) / 2,
            (firstRow + tie.string - 0.1) * cellHeight,
          )
        "
      />
    </svg>
  </OverlayCoords>
</template>

<style scoped>
path {
  stroke: black;
  stroke-width: 1;
}
</style>
