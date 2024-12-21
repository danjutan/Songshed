<script lang="ts" setup>
import type { TieType } from "~/model/data";

export type TieRenderProps = {
  type: TieType;
  to: number;
  from: number;
  half?: "left" | "right";
};
const props = defineProps<TieRenderProps>();
</script>

<template>
  <div
    class="tie-box"
    :class="{ left: props.half === 'left', right: props.half === 'right' }"
  >
    <div class="arc-rect" />
  </div>
</template>

<style scoped>
.tie-box {
  z-index: 1;
  align-self: center;
  pointer-events: none;
  margin-bottom: calc(var(--cell-height) * -1);
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: end;
  overflow: hidden;
}

.tie-box.left {
  /* border: 1px solid blue; */
}

.tie-box.right {
  /* border: 1px solid red; */
}
.arc-rect {
  border-bottom: 1px solid black;
  border-radius: calc(var(--cell-height));
  width: calc(100% - var(--cell-height));
  aspect-ratio: 1;
}

.left .arc-rect {
  border-bottom-right-radius: 0px;
  width: calc(100% - var(--cell-height) / 2);
  margin-left: auto;
}

.right .arc-rect {
  border-bottom-left-radius: 0px;
  width: calc(100% - var(--cell-height) / 2);
  margin-right: auto;
}
</style>
