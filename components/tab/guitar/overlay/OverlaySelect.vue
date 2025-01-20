<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { X, ChevronDown } from "lucide-vue-next";

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

const iconSize = 16;
const iconSizePx = `${iconSize}px`;
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
      <X :size="iconSize" @click="$emit('deleteClicked')" />
    </template>
    <template #dropdown>
      <ChevronDown :size="iconSize" />
    </template>
  </VueSelect>
</template>

<style scoped>
/* https://vue3-select-component.vercel.app/styling.html */

.select {
  pointer-events: all;
  /* Weird inconsistencies when trying to set opacity and box-shadow. TODO: revisit. See TieSelect*/
  /* --vs-input-bg: rgba(255, 255, 255, 0.8); */
  --vs-input-placeholder-color: black;
  --vs-font-size: calc(var(--note-font-size) * 0.75);
  --vs-option-padding: 1px 2px;
  --vs-indicators-gap: 0px;
  --vs-menu-offset-top: 2px;

  width: fit-content !important;

  &.inactive:not(.open) {
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

  &:not(.inactive) :deep(.control),
  &.open :deep(.control) {
    padding-left: 2px;
    /* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); */
  }

  &:not(.inactive),
  &.open {
    margin-left: -2px;
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

    & button {
      width: v-bind(iconSizePx);
      height: v-bind(iconSizePx);
    }
  }
}
</style>
