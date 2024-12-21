<script lang="ts" setup>
import type { TieType } from "~/model/data";
import type { OverlayPosition } from "../../overlay-objects";

export type TieRenderProps = OverlayPosition & {
  type: TieType;
  to: number;
  from: number;
  half?: "left" | "right";
  editing?: boolean;
  direction: "up" | "down";
};

const emit = defineEmits<{
  updateType: [type: TieType];
  delete: [];
}>();
const props = defineProps<TieRenderProps>();

const hammerText = computed(() => (props.direction === "up" ? "H" : "P"));

const labelText = computed(() => {
  if (props.type === "hammer") {
    return hammerText.value;
  }
  return "S";
});

function onSelectInput(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  emit("updateType", value as TieType);
}
</script>

<template>
  <div
    class="container"
    :class="{
      full: !props.half,
      left: props.half === 'left',
      right: props.half === 'right',
      up: props.direction === 'up',
      down: props.direction === 'down',
      slide: props.type === 'slide',
      hammer: props.type === 'hammer',
    }"
  >
    <div v-if="props.type === 'slide'" class="slide-box" />
    <div v-else class="tie-box">
      <div class="arc-rect" />
    </div>

    <div v-if="props.half !== 'left'" class="indicator" :class="{ editing }">
      <select @input="onSelectInput">
        <option value="hammer" :selected="type === 'hammer'">
          {{ hammerText }}
        </option>
        <option value="slide" :selected="type === 'slide'">S</option>
      </select>
      <div class="label">{{ labelText }}</div>
      <div class="delete" @click="emit('delete')">&Cross;</div>
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
  .full.hammer * {
    display: none;
  }
}

@container (aspect-ratio < 2.5) {
  .full.slide * {
    display: none;
  }
}

@container (aspect-ratio < 0.79) {
  .left.hammer *,
  .right.hammer * {
    display: none;
  }
}

@container (aspect-ratio < 1.25) {
  .left.slide *,
  .right.slide * {
    display: none;
  }
}

.slide-box {
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

.down .slide-box {
  transform: scaleY(-1);
}

.left .slide-box {
  justify-self: end;
  width: calc(100% - 50% / var(--column-span) - var(--cell-height) / 4);
  /*TODO: make this look better across dividers, probably with an "other half (start or end point)" prop*/
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

.right .slide-box {
  justify-self: start;
  width: calc(100% - 50% / var(--column-span) - var(--cell-height) / 4);
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
  /* width: calc(100% + var(--cell-height)); */
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
  --left-path-point: calc(-1 * var(--margin-left));
  --right-path-point: calc(
    var(--left-path-point) + var(--label-font-size) * 0.7
  );

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
  z-index: 1;
  display: flex;
  align-items: start;

  & select,
  .label {
    font-size: var(--label-font-size);
  }

  & select {
    display: none;
  }

  & .delete {
    font-size: calc(var(--label-font-size) * 0.8);
    transform: translateY(-25%);
    display: none;
    color: maroon;
    cursor: pointer;
    padding: 0px 1px;
    &:hover {
      font-weight: bold;
      color: darkred;
    }
  }

  &.editing,
  &:hover {
    margin-right: calc(var(--label-font-size) * -1.6);
    & .label {
      display: none;
    }
    & select,
    .delete {
      display: block;
    }
  }
}

.slide .indicator {
  transform: translateY(-38%);
}

.hammer .indicator {
  transform: translateY(-54%);
}

.right .indicator {
  justify-self: start;
  & .label {
    margin-left: 1px;
  }
  /* transform: translateX(-200%) translateY(30%); */
}
</style>
