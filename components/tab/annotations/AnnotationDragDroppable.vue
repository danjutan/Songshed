<script lang="ts" setup>
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import OverlayCoords from "~/components/tab/bars/OverlayCoords.vue";

const props = defineProps<{
  row: number;
  position: number;
  firstInBar: boolean;
}>();

const dragRef = useTemplateRef("container");
</script>

<template>
  <OverlayCoords v-slot="{ coords: [coords] }" :positions="[position]">
    <div
      v-if="coords"
      ref="container"
      class="draggable"
      :style="{
        left: firstInBar
          ? `${coords.left}px`
          : `calc(${coords.left}px + var(--divider-width))`,
        width: firstInBar
          ? `calc(${coords.right - coords.left}px + var(--divider-width))`
          : `${coords.right - coords.left}px`,
      }"
      @click="console.log(position, row)"
    />
  </OverlayCoords>
</template>

<style scoped>
.draggable {
  border: 1px solid black;
  position: absolute;
  top: calc(v-bind(row) * var(--cell-height));
  height: var(--cell-height);
}
</style>
