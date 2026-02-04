<script lang="ts" setup>
import Select from "primevue/select";
import { X, ChevronDown } from "lucide-vue-next";
import { injectSpacingsState } from "~/components/tab/providers/provide-spacings";

const props = defineProps<{
  options: Array<[value: string | number, label: string]>;
  active: boolean;
  hide?: boolean;
  pointerEventsNone?: boolean;
  showClear?: boolean;
  optionStyles?: Record<string, string>;
}>();

const { cellHeightPx } = injectSpacingsState();
// We have to use `style` explicitly to style the options because they're teleported outside of scope
const fontSizePx = computed(() => `calc(${cellHeightPx.value} * 0.6)`);

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
    :class="{ inactive: !active, hide, none: pointerEventsNone }"
    :options
    option-label="label"
    option-value="value"
    size="small"
    :show-clear="showClear"
    pt:dropdown:class="dropdown"
    pt:label:class="label"
  >
    <template #value="{ value }">
      <span v-html="optionsMap[value]" />
    </template>
    <template #option="{ option }">
      <span
        :style="{
          fontSize: fontSizePx,
          lineHeight: fontSizePx,
          ...optionStyles,
        }"
        v-html="option.label"
      />
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
  --p-select-sm-padding-x: 4px; /* applies only to left side */
  --p-select-sm-padding-y: 4px;
  margin-top: -1px;

  transition: none; /* TODO: deliberately figure out transitions */

  pointer-events: all;
  &.none {
    pointer-events: none;
  }
  &.inactive:not(:has(:focus)) {
    background: none;
    border: none;
    outline: none;
    box-shadow: none;
    margin-top: var(--p-select-sm-padding-y);
    margin-left: var(--p-select-sm-padding-x);

    &:deep(.label) {
      padding-block: 0px;
      padding-inline: 0px;
    }

    & .clear,
    & :deep(.dropdown) {
      display: none;
    }

    &.hide {
      /* visibility: hidden and display: none don't allow focus */
      opacity: 0;
    }
  }

  &:deep(.dropdown) {
    width: unset;
    padding-right: 2px;
    &:hover {
      color: var(--p-text-color);
      transition: color 0.1s ease-in-out;
    }
  }

  &:deep(.label) {
    font-size: v-bind(fontSizePx);
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
/* .options-teleport {
  --p-select-option-padding: 1px 2px;
  margin-top: unset !important;
} */

.p-select-option {
  justify-content: center;
}
</style>
