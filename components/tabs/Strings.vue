<script lang="ts" setup>
</script>

<template>
  <div class="strings">
    <div v-for="i in 10"
         :key="i"
         class="string-box">
      <div class="string" />
    </div>
  </div>
</template>

<style scoped>
.strings {
  grid-row: 2 / -1;
  grid-column: 1 / -1;
  width: 100%;
  overflow-y: hidden;
}

.string-box {
  width: 100%;
  height: var(--cell-height);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.string {
  height: var(--string-width);
  background-color: var(--string-color)
}
</style>
