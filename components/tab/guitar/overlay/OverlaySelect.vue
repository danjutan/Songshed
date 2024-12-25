<script lang="ts" setup>
import VueSelect from "vue3-select-component";

const props = defineProps<{
  options: Array<[value: number | string, label: string]>;
  placeholder: string | number;
}>();

const model = defineModel();

const emit = defineEmits<{
  onDeleteClicked: () => void;
}>();

const options = computed(() => {
  return props.options.map(([value, label]) => ({ label, value }));
});
</script>

<template>
  <VueSelect
    v-model="model"
    class="select"
    :options
    :placeholder="`${placeholder}`"
  >
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

<style scoped></style>
