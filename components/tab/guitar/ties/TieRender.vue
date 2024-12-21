<script lang="ts" setup>
import type { TieType } from "~/model/data";
import type { OverlayPosition } from "../../overlay-objects";

export type TieRenderProps = OverlayPosition & {
  type: TieType;
  to: number;
  from: number;
  half?: "left" | "right";
  otherHalfColumns?: number;
  editing?: boolean;
  direction: "up" | "down";
  lastString?: boolean;
};

const emit = defineEmits<{
  updateType: [type: TieType];
  delete: [];
  blockClicked: [];
}>();
const props = defineProps<TieRenderProps>();

const hammerText = computed(() => (props.direction === "up" ? "H" : "P"));
const slideText = computed(() =>
  props.direction === "up" ? "&#x27CB;" : "&#x27CD;",
);

const labelText = computed(() => {
  if (props.type.hammer) {
    return hammerText.value;
  }
  return slideText.value;
});

function onSelectInput(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  if (value === "delete") {
    emit("delete");
    return;
  }
  if (value === "hammer") {
    emit("updateType", { hammer: true });
    return;
  }
  if (value === "slide") {
    emit("updateType", { slide: true });
    return;
  }
  if (value === "hammer-slide") {
    emit("updateType", { slide: true, hammer: true });
    return;
  }
}
</script>

<template>
  <div
    class="container"
    :class="{
      full: !half,
      left: half === 'left',
      right: half === 'right',
      up: direction === 'up',
      down: direction === 'down',
      slide: type.slide,
      hammer: type.hammer,
      bottom: lastString,
    }"
  >
    <div v-if="endColumn - startColumn >= (half ? 1 : 2)" class="block-notes" />

    <div v-if="props.type.slide" class="slide-box" />
    <!-- <svg
      v-if="props.type === 'slide'"
      class="slide-svg"
      viewBox="0 0 50 50"
      preserveAspectRatio="none"
    >
      <line x1="0" y1="50" x2="50" y2="0" />
    </svg> -->

    <div v-if="props.type.hammer" class="tie-box">
      <div class="arc-rect" />
    </div>

    <div v-if="props.half !== 'left'" class="indicator" :class="{ editing }">
      <select @input="onSelectInput">
        <option
          value="hammer"
          :selected="type.hammer && !type.slide"
          v-html="hammerText"
        />
        <option
          value="slide"
          :selected="type.slide && !type.hammer"
          v-html="slideText"
        />
        <option
          value="hammer-slide"
          :selected="type.slide && type.hammer"
          v-html="hammerText + slideText"
        />
        <option value="delete">&Cross;</option>
      </select>
      <div v-if="type.hammer" class="label">{{ labelText }}</div>
      <!-- <div class="delete" @click="emit('delete')">&Cross;</div> -->
    </div>
  </div>
</template>

<style scoped>
.container {
  --column-span: calc(v-bind(endColumn) - v-bind(startColumn) + 1);
  --label-font-size: calc(var(--cell-height) * 0.6);
  pointer-events: none;
  grid-row: v-bind(row);
  grid-column: v-bind(startColumn) / calc(v-bind(endColumn) + 1);
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

@container (aspect-ratio < 1.6) {
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

.block-notes {
  pointer-events: auto;
  grid-row: v-bind(row);
  height: var(--cell-height);
  grid-area: 1 / 1;
  width: calc(100% - 100% / (var(--column-span)));
}

.full .block-notes {
  width: calc(100% - 200% / (var(--column-span)));
}

.left .block-notes {
  justify-self: end;
}

.right .block-notes {
  justify-self: start;
}

/* .slide-svg {
  grid-area: 1 / 1;
  width: calc(100% - 100% / var(--column-span) - var(--cell-height));
  height: calc(var(--cell-height) / 2);
  margin-top: calc(var(--cell-height) / 4);

  & line {
    stroke: black;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
} */

.slide-box {
  grid-area: 1 / 1;
  width: calc(100% - 100% / var(--column-span) - var(--note-font-size));
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

.left .slide-box,
.right .slide-box {
  --margin: calc(50% / var(--column-span) + var(--note-font-size) / 2);
  --end: calc(
    100% * (v-bind(otherHalfColumns)) / var(--column-span) +
      var(--divider-width) - var(--margin)
  );
  width: 100%;
}

.left .slide-box {
  justify-self: end;
  clip-path: none;
  clip-path: polygon(
    var(--margin) calc(100% - 1px),
    calc(100% + var(--end)) 0%,
    calc(100% + var(--end)) 1px,
    calc(var(--margin) + 1px) 100%
  );
}

.right .slide-box {
  justify-self: start;
  clip-path: none;
  clip-path: polygon(
    calc(-1 * var(--end)) calc(100% - 1px),
    calc(100% - 1px - var(--margin)) 0%,
    calc(100% - var(--margin)) 1px,
    calc(-1 * var(--end)) 100%
  );
}

.tie-box {
  grid-row: 1 / 1;
  grid-column: 1 / 1;
  width: 100%;
  z-index: 1;
  margin-top: calc(var(--cell-height) * 0.85);
  height: calc(var(--cell-height) * 0.5);
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
  --gap-multiplier: 0.7;
  --right-path-point: calc(
    var(--left-path-point) + var(--label-font-size) * var(--gap-multiplier)
  );

  border-bottom-left-radius: 0px;
  width: 100%;
  margin-left: var(--margin-left);
}

.right .arc-rect {
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

.right.bottom .arc-rect {
  width: calc(100% + var(--note-font-size));
  --margin-left: calc(-100% / (2 * var(--column-span)) - var(--note-font-size));
  --gap-multiplier: 1;
}

.right.bottom .tie-box {
  width: calc(100% + var(--cell-height) * 2);
}

.indicator {
  pointer-events: auto;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: start;

  & select,
  .label {
    font-size: var(--label-font-size);
  }

  & select {
    display: none;
    /* text-align: center; */
    /* margin-left: -10px; */
    transform: translateY(-10%);
    & [value="delete"] {
      color: darkred;
    }
  }

  /* & .delete {
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
  } */
}

.container:has(.block-notes:hover) .indicator,
.indicator.editing,
.indicator:hover {
  margin-right: calc(var(--label-font-size) * -1.6);
  width: calc(100% - 100% / var(--column-span));
  & .label {
    display: none;
  }
  & select,
  .delete {
    display: block;
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

.right.bottom .indicator {
  transform: translateX(-100%) translateY(-50%);
}
</style>
