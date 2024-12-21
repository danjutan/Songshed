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
    class="container"
    :class="{
      full: !props.half,
      left: props.half === 'left',
      right: props.half === 'right',
    }"
  >
    <div class="slide" />
    <div class="tie-box">
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
  </div>
</template>

<style scoped>
.container {
  --column-span: calc(v-bind(endColumn) - v-bind(startColumn) + 1);
  --label-font-size: calc(var(--cell-height) * 0.6);
  pointer-events: none;
  /* border: 1px solid red; */
  grid-row: v-bind(row);
  grid-column: v-bind(startColumn) / calc(v-bind(endColumn) + 1);
  /* height: calc(
    var(--cell-height) * (v-bind(endColumn) + 1 - v-bind(startColumn))
  ); */
  height: var(--cell-height);
  display: grid;
  align-items: start;
  justify-items: center;
  container-type: size;
}

@container (aspect-ratio < 1.5) {
  .full .tie-box {
    opacity: 0;
  }
}

@container (aspect-ratio < 2.5) {
  .full .slide {
    opacity: 0;
  }
}

@container (aspect-ratio < 0.79) {
  .left .tie-box,
  .right .tie-box {
    opacity: 0;
  }
}

.slide {
  grid-row: 1 / 1;
  grid-column: 1 / 1;
  width: calc(100% - 100% / var(--column-span) - var(--cell-height));
  height: calc(var(--cell-height) / 2);
  margin-top: calc(var(--cell-height) / 4);
  background-color: black;
  clip-path: polygon(
    -1px calc(100% - 1px),
    100% 0%,
    calc(100% + 1px) 1px,
    0% 100%
  );
}

.left .slide {
  justify-self: end;
  width: calc(100% - 50% / var(--column-span) - var(--cell-height) / 2);
  /*TODO: make this look better across dividers*/
  clip-path: polygon(
    -1px calc(100% - 1px),
    calc(100%) calc(50%),
    calc(100% + 1px) calc(50% + 1px),
    0px 100%
  );
  /* clip-path: polygon(
    0% calc(100% - 1px),
    calc(100% + var(--divider-width) / 2 + 1px) 50%,
    calc(100% + var(--divider-width) / 2) calc(50% + 1px),
    1px 100%
  ); */
}

.right .slide {
  justify-self: start;
  width: calc(100% - 50% / var(--column-span) - var(--cell-height) / 2);
  clip-path: polygon(
    -1px calc(50% - 1px),
    100% 0%,
    calc(100% + 1px) 1px,
    0px 50%
  );

  /* clip-path: polygon(
    calc(-1 * var(--divider-width) / 2 - 1px) calc(50% - 1px),
    calc(100% - 1px) 0%,
    100% 1px,
    calc(-1 * var(--divider-width) / 2) 50%
  ); */
}

.tie-box {
  grid-row: 1 / 1;
  grid-column: 1 / 1;
  width: 100%;
  /* border: 1px solid black; */
  z-index: 1;
  /* align-self: center; */
  /* margin-bottom: calc(var(--cell-height) * -2); */
  margin-top: calc(var(--cell-height) * 0.85);
  height: calc(var(--cell-height) * 0.5);
  /* height: 50%; */
  display: flex;
  align-items: end;
  overflow: hidden;
}

.full .tie-box {
  justify-content: center;
}

.left .tie-box {
  justify-content: end;
}

.right .tie-box {
  justify-content: start;
}

.arc-rect {
  /* margin-bottom: calc(var(--cell-height) * 0.25); */
  border: 1.5px solid black;
  border-radius: calc(var(--cell-height));
  width: calc(100% - 100% / var(--column-span));
  /* width: 100%; */
  aspect-ratio: 1;
}
.full .tie-box .arc-rect {
  clip-path: polygon(
    0% 0%,
    0% 100%,
    calc(50% - var(--label-font-size) / 4 - 1px) 100%,
    calc(50% - var(--label-font-size) / 4 - 1px) 80%,
    calc(50% + var(--label-font-size) / 4 + 1px) 80%,
    calc(50% + var(--label-font-size) / 4 + 1px) 100%,
    25% 100%,
    25% 100%,
    100% 100%,
    100% 0%
  );
}

.right .arc-rect {
  --margin-left: calc(-100% / (2 * var(--column-span)));
  --left-path-point: calc(-1 * var(--margin-left) + 3px);
  --right-path-point: calc(var(--left-path-point) + var(--label-font-size) / 2);

  border-bottom-left-radius: 0px;
  width: 100%;
  margin-left: var(--margin-left);

  clip-path: polygon(
    0% 0%,
    0% 100%,
    var(--left-path-point) 100%,
    var(--left-path-point) 80%,
    var(--right-path-point) 80%,
    var(--right-path-point) 100%,
    25% 100%,
    25% 100%,
    100% 100%,
    100% 0%
  );
}

.left .arc-rect {
  border-bottom-right-radius: 0px;
  width: 100%;
  margin-right: calc(-100% / (2 * var(--column-span)));
}

.indicator {
  pointer-events: auto;
  position: absolute;
  transform: translateY(40%);

  & select,
  .label {
    font-size: var(--label-font-size);
  }

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
