<script lang="ts" setup></script>

<template>
  <div class="stack">
    <slot />
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  grid-template-rows: subgrid;
}

/* .centered {
  grid-row: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
} */
</style>
