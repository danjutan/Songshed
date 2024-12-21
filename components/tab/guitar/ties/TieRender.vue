<script lang="ts" setup>
import type { TieType } from "~/model/data";
import type { OverlayPosition } from "../../overlay-objects";

export type TieRenderProps = OverlayPosition & {
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
    <div class="arc-rect" />
    <div v-if="props.half !== 'left'" class="indicator" :class="{ editing }">
      <select>
        <option value="h">h</option>
        <option value="p">p</option>
        <option value="s">s</option>
      </select>
      <div class="label">{{ props.type }}</div>
    </div>
  </div>
</template>

<style scoped>
.tie-box {
  /* border: 1px solid black; */
  grid-row: v-bind(row);
  grid-column: v-bind(startColumn) / calc(v-bind(endColumn) + 1);
  z-index: 1;
  align-self: center;
  pointer-events: none;
  margin-bottom: calc(var(--cell-height) * -1.1);
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: end;
  overflow: hidden;

  &.right {
    justify-content: start;
  }
}

.tie-box.left {
  /* border: 1px solid blue; */
}

.tie-box.right {
  /* border: 1px solid red; */
}
.arc-rect {
  /* margin-bottom: calc(var(--cell-height) * 0.25); */
  border-bottom: 1.5px solid black;
  border-radius: calc(var(--cell-height));
  width: calc(100% - 100% / (v-bind(endColumn) - v-bind(startColumn) + 1));
  /* width: 100%; */
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: end;
}

.tie-box:not(.left):not(.right) .arc-rect {
  clip-path: polygon(
    0% 0%,
    0% 100%,
    calc(50% - 4px) 100%,
    calc(50% - 4px) 80%,
    calc(50% + 4px) 80%,
    calc(50% + 4px) 100%,
    25% 100%,
    25% 100%,
    100% 100%,
    100% 0%
  );
}

.tie-box.right .arc-rect {
  clip-path: polygon(
    0% 0%,
    0% 100%,
    2px 100%,
    2px 80%,
    9px 80%,
    9px 100%,
    75% 100%,
    75% 100%,
    100% 100%,
    100% 0%
  );
}

.left .arc-rect {
  border-bottom-right-radius: 0px;
  width: calc(100% - 50% / (v-bind(endColumn) - v-bind(startColumn) + 1));
  margin-left: auto;
}

.right .arc-rect {
  border-bottom-left-radius: 0px;
  width: calc(100% - 50% / (v-bind(endColumn) - v-bind(startColumn) + 1));
  margin-right: auto;
}

.indicator {
  pointer-events: auto;
  position: absolute;
  transform: translateY(30%);

  & select {
    display: none;
  }
  &.editing,
  &:hover {
    & .label {
      display: none;
    }
    & select {
      display: block;
    }
  }
}

.right .indicator .label {
  margin-left: 2px;
  /* transform: translateX(-200%) translateY(30%); */
}
</style>
