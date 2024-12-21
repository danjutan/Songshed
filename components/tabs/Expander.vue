<script lang="ts" setup>

</script>

<template>
  <div class="expander">
    <div class="preview">
      <slot/>
    </div>
  <button class="expand-button"> <span>↦</span> </button>
  </div>
</template>

<style scoped>

.expander {
  display: grid;
  grid-auto-flow: column;
  width: 100%;
  overflow: hidden;
  container-type: size;
  container-name: expander;
}

.preview {
  grid-column: 1 / -1;
  grid-row: 1 / span 1;
  opacity: 0.6;
  /* width: calc(var(--min-division-width) / 2); */
  overflow: hidden;
}

.expand-button {
  grid-column: 1 / -1;
  grid-row: 1 / span 1;
  justify-self: end;
  width: 50%;
  min-width: 18px;
  height: 100%;
  background-color: gray;
  opacity: 0.5;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

@container expander (width < 18px) {
  .preview, .expand-button {
    display: none;
  }
}
</style>