<script lang="ts" setup>
import type { TieType } from "~/model/data";

export type TieRenderProps = {
  type: TieType;
  to: number;
  from: number;
  half?: "left" | "right";
  editing?: boolean;
};
const props = defineProps<TieRenderProps>();
</script>

<template>
  <div
    class="tie-box"
    :class="{ left: props.half === 'left', right: props.half === 'right' }"
  >
    <div class="arc-rect">
      <div v-if="props.half !== 'left'" class="indicator" :class="{ editing }">
        <select>
          <option value="h">h</option>
          <option value="p">p</option>
          <option value="s">s</option>
        </select>
        <div>{{ props.type }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tie-box {
  /* border: 1px solid black; */
  z-index: 1;
  align-self: center;
  pointer-events: none;
  margin-bottom: calc(var(--cell-height) * -1);
  height: 50%;
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
  margin-bottom: calc(var(--cell-height) * 0.25);
  border-bottom: 1px solid black;
  border-radius: calc(var(--cell-height));
  width: calc(100% - var(--cell-height));
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: end;
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

.indicator {
  pointer-events: auto;
  position: absolute;
  transform: translateY(55%);

  & select {
    display: none;
  }
  &.editing,
  &:hover {
    & div {
      display: none;
    }
    & select {
      display: block;
    }
  }
}
</style>
