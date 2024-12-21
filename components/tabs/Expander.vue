<script lang="ts" setup>
const expanded = ref(false);
const overflow = computed(() => expanded.value ? "visible" : "hidden");

</script>

<template>
  <div class="expander">
    <div class="preview">
      <slot/>
    </div>
  <button class="expand-button" @click="expanded = !expanded"> <span>↦</span> </button>
  </div>
</template>

<style scoped>

.expander {
  display: grid;
  grid-auto-flow: column;
  width: 100%;
  container-type: size;
  container-name: expander;
}

.preview {
  grid-column: 1 / 1;
  grid-row: 1 / 1;
  /* width: calc(var(--min-division-width) / 2); */
  overflow: v-bind(overflow);
  background: white;
}

.expand-button {
  grid-column: 1 / 1;
  grid-row: 1 / 1;
  justify-self: end;
  width: 100%;
  min-width: calc(var(--min-division-width) / 4);
  background-color: gray;
  opacity: 0.5;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  cursor: pointer;
  border: none;
}

@container expander (width < 16px) {
  .expand-button span {
    display: none;
  }
  /* .preview {
    display: none;
  } */
}
</style>