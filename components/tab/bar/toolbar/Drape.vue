<script lang="ts" setup>
// TODO: use a big square container sensor to hide all of the drape stuff when the entire drape is big enough
export type DrapeData = {
  start: number
  columns: number
};

const props = withDefaults(
  defineProps<
    DrapeData & {
      default?: "show" | "hide"
      collapsed?: "show" | "hide"
      up?: "same" | "reverse"
      color?: string
      numStrings: number
      heightUnit?: string
      rowStart?: number
    }
  >(),
  {
    default: "show",
    collapsed: "show",
    up: "same",
    color: "transparent",
    rowStart: 1,
    // e.g. multiply this by 2 and the collapse will trigger at half the width
    heightUnit: "var(--cell-height)",
  },
);

defineSlots<{
  down: () => never
  up: () => never
}>();

const toDisplay = (p: "show" | "hide") => (p === "show" ? "block" : "none");
const toReverse = (p: "show" | "hide") => (p === "show" ? "hide" : "show");

const defaultDisplay = computed(() => toDisplay(props.default));
const collapsedDisplay = computed(() => toDisplay(props.collapsed));

const upDefaultDisplay = computed(() => {
  if (props.up === "same") {
    return defaultDisplay.value;
  }
  return toDisplay(toReverse(props.default));
});

const upCollapsedDisplay = computed(() => {
  if (props.up === "same") {
    return collapsedDisplay.value;
  }
  return toDisplay(toReverse(props.collapsed));
});
// const columnEnd = computed(() => props.columns ? `span ${props.columns}` : "-1");
</script>

<template>
  <div class="drape collapse">
    <div class="drape-down">
      <slot name="down" />
    </div>
    <div class="drape-up">
      <slot name="up" />
    </div>
  </div>
</template>

<style>
.collapse {
  container-name: drape;
  container-type: size;
}

.drape {
  grid-column: v-bind(start) / span v-bind(columns);
  grid-row: v-bind(rowStart) / span v-bind(numStrings);
  /* rid-row: 2; */
  height: calc(v-bind(heightUnit) * v-bind(columns));
  pointer-events: none;
}

.drape-down {
  background-color: v-bind(color);
  pointer-events: auto;
  height: calc(v-bind(numStrings) * var(--cell-height));
  display: v-bind(defaultDisplay);
}

.drape-up {
  width: 100%;
  pointer-events: auto;
  position: absolute;
  top: calc(v-bind(numStrings) * var(--cell-height));
  display: v-bind(upDefaultDisplay);
}

@container drape (aspect-ratio < 0.5) {
  .drape-down {
    display: v-bind(collapsedDisplay);
  }
  .drape-up {
    display: v-bind(upCollapsedDisplay);
  }
}
</style>
