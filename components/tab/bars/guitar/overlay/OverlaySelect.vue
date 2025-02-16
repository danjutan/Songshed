<script lang="ts" setup>
import Select from "primevue/select";
import { X, ChevronDown } from "lucide-vue-next";

const props = defineProps<{
  options: Array<[value: string | number, label: string]>;
  active: boolean; // if false, becomes active on hover
  optionsTeleportClass?: string;
  placeholder?: string;
  overrideDisplay?: { [value: string]: string };
  hide?: boolean;
}>();

const model = defineModel();

const emit = defineEmits<{
  deleteClicked: () => void;
}>();

const options = computed(() => {
  return props.options.map(([value, label]) => ({ label, value }));
});

const optionsMap = computed(() => {
  return Object.fromEntries(props.options);
});

const iconSize = 16;
</script>

<template>
  <Select
    v-model="model"
    class="overlay-select"
    :class="{ inactive: !active, hide }"
    :options
    option-label="label"
    option-value="value"
    size="small"
    :placeholder="placeholder"
    show-clear
    pt:dropdown:class="dropdown"
    :pt:overlay:class="[optionsTeleportClass, 'options-teleport']"
    @click="console.log('clicked')"
  >
    <template #value="{ value }">
      <span v-html="optionsMap[value]" />
    </template>
    <template #option="{ option }">
      <span v-html="option.label" />
    </template>
    <template #dropdownicon>
      <ChevronDown :size="iconSize" />
    </template>
    <template #clearicon>
      <X class="clear" :size="iconSize" @click="$emit('deleteClicked')" />
    </template>
  </Select>
</template>

<style scoped>
.overlay-select {
  pointer-events: all;
  --p-select-sm-padding-x: 4px; /* applies only to left side */
  --p-select-sm-padding-y: 4px;
  transition: none; /* TODO: deliberately figure out transitions */
  margin-top: -1px;

  &.inactive:not(:has(:focus)) {
    background: none;
    border: none;
    outline: none;
    box-shadow: none;

    & .clear,
    & :deep(.dropdown) {
      display: none;
    }

    &.hide {
      visibility: hidden;
    }
  }

  /* &.hide:not(:has(:focus)) {
    visibility: hidden;
  } */

  &:deep(.dropdown) {
    width: unset;
    padding-right: 2px;
    &:hover {
      color: var(--p-text-color);
      transition: color 0.1s ease-in-out;
    }
  }
}

.clear {
  align-self: center;
  color: var(--p-select-dropdown-color);
  &:hover {
    color: var(--p-text-color);
    transition: color 0.1s ease-in-out;
  }
}
</style>
<style>
.options-teleport {
  --p-select-option-padding: 1px 2px;
  margin-top: unset !important;
}
</style>
