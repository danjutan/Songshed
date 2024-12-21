<script lang="ts" setup>
import { useTiePath } from "./use-tie-path";
</script>

<template>
  <svg>
    <path :d="useTiePath(10, 100, 100)" />
  </svg>
</template>

<style scoped>
path {
  stroke: black;
  stroke-width: 1;
}
</style>
