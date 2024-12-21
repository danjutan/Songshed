<script lang="ts" setup>

</script>

<template>
  <div class="expander">
    <div class="preview">
      <slot/>
    </div>
  <button class="expand-button"> > </button>
  </div>
</template>

<style scoped>

.expander {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
}

.preview {
  grid-column: 1 / -1;
}

.expand-button {
  grid-column: -1 / span 1;
  grid-row: 1 / span 1;
  width: 16px;
  background-color: gray;
  opacity: 0.5;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>