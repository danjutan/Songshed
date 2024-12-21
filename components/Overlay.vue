<script lang="ts" setup>
</script>

<template>
  <div class="overlay">
    <slot/>
  </div>
</template>

<style>
.overlay {
  display: grid;
  grid: subgrid / subgrid;
}
.overlay > * {
  grid-area: 1 / 1;
}
</style>