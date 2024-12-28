<script lang="ts" setup>
import VueSelect from "vue3-select-component";

const props = defineProps<{
  options: Array<[value: string, label: string]>;
  placeholder: string;
}>();

const model = defineModel({
  get(value) {
    return `${value}`;
  },
});

const emit = defineEmits<{
  onDeleteClicked: () => void;
}>();

const options = computed(() => {
  return props.options.map(([value, label]) => ({ label, value }));
});

watchEffect(() => {
  console.log(model.value);
});
</script>

<template>
  <VueSelect v-model="model" class="select" :options :placeholder>
    <template #value="{ option }">
      <span v-html="option.label" />
    </template>
    <template #option="{ option }">
      <span v-html="option.label" />
    </template>
    <template #clear>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        @click="$emit('onDeleteClicked')"
      >
        <path
          d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
        />
      </svg>
    </template>
  </VueSelect>
</template>

<style scoped>
/* https://vue3-select-component.vercel.app/styling.html */
/*
.select:hover {
  width: 100%;
}

.select :deep(.control) {
  min-height: 0px;
  height: 0px;
}


.select:not(:hover) {
  --vs-border: 0px;
  --vs-input-outline: none;
}

.select:not(:hover) :deep(.indicators-container) {
  display: none !important;
} */

.select {
  pointer-events: all;
  --vs-input-placeholder-color: black;
  --vs-font-size: calc(var(--note-font-size) * 0.8);
}

.select :deep(.value-container) {
  height: fit-content;
  & > * {
    padding-block: 0px;
    padding-inline: 0px;
  }
}

.select :deep(.control) {
  height: fit-content;
  min-height: 0px;
}

.select :deep(.indicators-container) {
  height: fit-content;
  min-height: 0px;
  padding: 0px;
}
</style>
