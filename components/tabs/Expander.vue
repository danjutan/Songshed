<script lang="ts" setup>
const expanded = ref(false);
const overflow = computed(() => expanded.value ? "visible" : "auto");
const buttonText = computed(() => expanded.value ? "↤" : "⇥");
</script>

<template>
  <div class="expander">
    <!-- <button class="expand-button" @click="expanded = !expanded">{{ buttonText }} </button> -->
    <div class="preview">
      <slot/>
    </div>
  </div>
</template>

<style scoped>

.expander {
  display: grid;
  grid-auto-flow: column;
  width: 100%;
  container-type: size;
  container-name: expander;
  background: white;
}

.preview {
  grid-column: 1 / 1;
  grid-row: 1 / 1;
  /* width: calc(var(--min-division-width) / 2); */
  overflow-x: v-bind(overflow);
}

.expand-button {
  grid-column: 1 / 1;
  grid-row: 1 / 1;
  justify-self: end;
  align-self: center;
  opacity: 0.5;
  background: white;
  cursor: pointer;
  border: none;
  border-radius: 5px;
}

.expand-button > span {
  /* z-index: var(--z-index-expander-button); */
}
@container expander (width < 16px) {
  /* .expand-button, .preview {
    display: none;
  } */
  /* .preview {
    display: none;
  } */
}
</style>