<script lang="ts" setup>
// TODO: use a big square container sensor to hide all of the drape stuff when the entire drape is big enough
export type DrapeData = {
  start: number
  columns: number
};

type CollapseBehavior = {
  expanded: "show" | "hide"
  collapsed: "show" | "hide"
};

const props = withDefaults(
  defineProps<
    DrapeData & {
      down?: CollapseBehavior
      up?: CollapseBehavior
      color?: string
      numStrings: number
      heightUnit?: string
      rowStart?: number
    }
  >(),
  {
    down: () => ({ expanded: "show", collapsed: "show" }),
    up: () => ({ expanded: "show", collapsed: "show" }),
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

const defaultDisplay = toDisplay(props.down.expanded);
const collapsedDisplay = toDisplay(props.down.collapsed);
const upDefaultDisplay = toDisplay(props.up.expanded);
const upCollapsedDisplay = toDisplay(props.up.collapsed);

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
