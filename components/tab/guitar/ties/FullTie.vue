<script lang="ts" setup>
const props = defineProps<{}>;
</script>

<template>
  <div class="tie-box">
    <div class="arc-rect" />
  </div>
</template>

<style scoped>
.tie-box {
  /* border: 1px solid red; */
  z-index: 1;
  align-self: end;
  pointer-events: none;
  margin-bottom: -5%;
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: end;
  overflow: hidden;
}

.arc-rect {
  border: 1px solid black;
  border-radius: calc(var(--cell-height));
  width: calc(100% - var(--cell-height));
  aspect-ratio: 1;
}
</style>
