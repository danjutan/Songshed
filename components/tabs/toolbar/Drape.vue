<script lang="ts" setup>
export type DrapeData = {
  start: number
  columns: number
};

const props = withDefaults(defineProps<DrapeData & {
  default?: "show" | "hide"
  collapsed: "show" | "hide"
  color: string
  numStrings: number
  heightUnit?: string
  rowStart?: number
}>(), {
  default: "show",
  collapsed: "show",
  rowStart: 1,
  // e.g. multiply this by 2 and the collapse will trigger at half the width
  heightUnit: "var(--min-division-width) / 2",
});

defineSlots<{
  down: () => never
  up: () => never
}>();

const defaultDisplay = computed(() => props.default === "show" ? "block" : "none");
const collapsedDisplay = computed(() => props.collapsed === "show" ? "block" : "none");
// const columnEnd = computed(() => props.columns ? `span ${props.columns}` : "-1");
</script>

<template>
  <div class="drape collapse">
    <div class="drape-down">
      <div class="drape-up">
        <slot name="up" />
      </div>
      <slot name="down" />
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
    grid-row: v-bind(rowStart) / -1;
    /* rid-row: 2; */
    height: calc(v-bind(heightUnit) * v-bind(columns));
    pointer-events: none;
  }

  .drape-down {
    background-color: v-bind(color);
    height: calc(v-bind(numStrings) * var(--min-division-width) / 2);
    display: v-bind(defaultDisplay);
  }

  .drape-up {
    width: 100%;
    pointer-events: auto;
    position: absolute;
    top: calc(-1 * v-bind(heightUnit));
  }

  @container drape (aspect-ratio < 0.5) {
    .drape-down {
      display: v-bind(collapsedDisplay);
    }
  }
</style>
