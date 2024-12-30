<script lang="ts" setup>
import VueSelect from "vue3-select-component";

const props = defineProps<{
  options: Array<[value: string | number, label: string]>;
  active: boolean; // if false, becomes active on hover
  placeholder?: string;
  overrideDisplay?: { [value: string]: string };
}>();

const model = defineModel();

const emit = defineEmits<{
  deleteClicked: () => void;
}>();

const options = computed(() => {
  return props.options.map(([value, label]) => ({ label, value }));
});

// watchEffect(() => {
//   console.log(model.value);
// });
</script>

<template>
  <VueSelect
    v-model="model"
    class="select"
    :class="{ inactive: !active }"
    :options
    :placeholder
  >
    <template #value="{ option }">
      <span v-html="overrideDisplay?.[option.value!] ?? option.label" />
    </template>
    <template #option="{ option }">
      <span v-html="option.label" />
    </template>
    <template #clear>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        @click="$emit('deleteClicked')"
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

.select {
  pointer-events: all;
  --vs-input-bg: rgba(255, 255, 255, 0.8);
  --vs-input-placeholder-color: black;
  --vs-font-size: calc(var(--note-font-size) * 0.75);
  --vs-option-padding: 1px 2px;
  --vs-indicators-gap: 0px;
  --vs-menu-offset-top: 2px;

  &.inactive:not(:hover):not(.open) {
    --vs-input-bg: transparent;
    --vs-input-outline: transparent;
    --vs-border: 1px solid transparent;

    width: fit-content;

    &:deep(.indicators-container) {
      display: none;
    }

    &:deep(.control) {
      /* width: 10px; */
    }
  }
}

.select.open :deep(.single-value) {
  position: static !important;
}

.select :deep(.control) {
  height: fit-content;
  width: fit-content;
  min-height: 0px;

  & .value-container {
    height: fit-content;
    max-width: fit-content;
    & > * {
      padding-block: 0px;
      padding-inline: 0px;
    }
  }

  & .indicators-container {
    flex-direction: row-reverse;
    min-height: 0px;
    /* height: fit-content; */
    padding: 0px;
  }
}
</style>
