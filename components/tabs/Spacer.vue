<script lang="ts" setup>
import type { SpacerData } from "./TabBar.vue";

const props = defineProps<{
  data: SpacerData
  strings: number
}>();

const emit = defineEmits<{
  hover: [string: number, notch: number]
}>();

const notchStart = computed(() => props.data.notchStart + 1);
const notches = computed(() => props.data.notches);

const headerPos = computed(() => Math.ceil(props.data.notches / 2));
const headerSpan = computed(() => props.data.notches % 2 === 0 ? 2 : 1);
const headerMargin = computed(() => props.data.notches % 2 === 0 ? "0%" : "-50%");
// const adjust = computed(() => (props.data.notches % 2))
</script>

<template>
  <div class="spacer">
    <div class="header">
      <span class="title">↔</span>
    </div>
    <template v-for="(n, ni) in notches"
              :key="n">
      <div
        v-for="(s) in strings"
        :key="s"
        class="spot"
        :style="{ gridColumn: n, gridRow: s }"
        @mouseover="emit('hover', s, notchStart + ni)"
      />
    </template>
  </div>
</template>

<style scoped>
.spacer {
  grid-row: 1 / span v-bind(strings);
  grid-column: v-bind(notchStart) / span v-bind(notches);
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(v-bind(notches), 1fr);
  grid-template-rows: repeat(v-bind(strings), 1fr);
}

.spot {
  width: 100%;
  height: 100%;
}

.header {
  grid-row: 1 / 1;
  grid-column: v-bind(headerPos) / span v-bind(headerSpan);
  text-align: center;
  container-type: size;
  margin: 0% v-bind(headerMargin);
  /* width: min(100%, calc(var(--min-division-width) / 2 * v-bind(notches))); */
  /* display: none; */
}

.title {
  opacity: 0;
  /* transition: opacity 0.1s; */
}

@container (aspect-ratio < 1) {

  .title {
    position: absolute;
    left: -100%;
    font-size: clamp(10px, 100cqw, 100%);
    opacity: 0.5;
  }
}
</style>
