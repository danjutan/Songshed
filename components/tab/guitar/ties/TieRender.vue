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
        <option value="H">H</option>
        <option value="P">P</option>
        <option value="S">S</option>
      </select>
      <div class="label">{{ props.type }}</div>
    </div>
  </div>
</template>

<style scoped>
.tie-box {
  --column-span: calc(v-bind(endColumn) - v-bind(startColumn) + 1);
  /* border: 1px solid black; */
  grid-row: v-bind(row);
  grid-column: v-bind(startColumn) / calc(v-bind(endColumn) + 1);
  z-index: 1;
  align-self: center;
  pointer-events: none;
  margin-bottom: calc(var(--cell-height) * -1.2);
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
  width: calc(100% - 100% / var(--column-span));
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
    16px 100%,
    16px 50%,
    24px 50%,
    24px 100%,
    75% 100%,
    75% 100%,
    100% 100%,
    100% 0%
  );
}

.left .arc-rect {
  border-bottom-right-radius: 0px;
  width: calc(2 * (100% - 50% / var(--column-span)));
  transform: translateX(calc(var(--cell-height) / 2));
}

.right .arc-rect {
  border-bottom-left-radius: 0px;
  /* width: calc(100% - 50% / (v-bind(endColumn) - v-bind(startColumn) + 1)); */
  width: calc(2 * (100% - 50% / var(--column-span)));
  transform: translateX(calc(var(--cell-height) / -2));
}

.indicator {
  pointer-events: auto;
  position: absolute;
  transform: translateY(40%);

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
  margin-left: 4px;
  /* transform: translateX(-200%) translateY(30%); */
}
</style>
