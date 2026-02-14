<script lang="ts" setup>
import { ZoomIn, ZoomOut } from "lucide-vue-next";
import { injectSettingsState } from "~/components/editor/providers/provide-settings-state";

const props = defineProps<{
  minSubdivision: number;
}>();

const settings = injectSettingsState();

const noteHTML = (unicode: string) =>
  `<span class="precision-note-glyph">${unicode}</span>`;

const subdivisionsOptions = computed(() => {
  const options = [
    { label: `1: ${noteHTML("&#xE1D5;")}`, value: 1 },
    { label: `2: ${noteHTML("&#xE1D7;")}`, value: 2 },
    { label: `4: ${noteHTML("&#xE1D9;")}`, value: 4 },
    { label: `8: ${noteHTML("&#xE1DB;")}`, value: 8 },
    // { label: `16: ${noteHTML("&#x1D163;")}`, value: 16 },
    // { label: `32: ${noteHTML("&#x1D164;")}`, value: 32 },
  ];
  return options.filter((option) => option.value >= props.minSubdivision);
});

const optionsMap = computed(() => {
  return Object.fromEntries(
    subdivisionsOptions.value.map((option) => [option.value, option.label]),
  );
});
</script>

<template>
  <Toolbar class="toolbar">
    <template #start>
      <FloatLabel variant="on" class="float-label">
        <Select
          id="subdivisions"
          v-model="settings.subdivisions"
          class="select"
          option-label="label"
          option-value="value"
          :options="subdivisionsOptions"
          pt:dropdown:class="dropdown"
        >
          <template #option="{ option }">
            <span v-html="option.label" />
          </template>
          <template #value="{ value }">
            <span v-html="optionsMap[value]" />
          </template>
        </Select>
        <label for="subdivisions">Precision</label>
      </FloatLabel>
    </template>
    <template #center />
    <template #end>
      <div class="flex">
        <Button
          severity="secondary"
          outlined
          :disabled="settings.cellHeight <= 12"
          @click="settings.cellHeight -= 4"
        >
          <template #icon>
            <ZoomOut :size="16" />
          </template>
        </Button>
        <Button
          severity="secondary"
          outlined
          :disabled="settings.cellHeight >= 48"
          @click="settings.cellHeight += 4"
        >
          <template #icon>
            <ZoomIn :size="16" />
          </template>
        </Button>
      </div>
    </template>
  </Toolbar>
</template>

<style>
.precision-note-glyph {
  font-family: Leland, serif;
  font-size: 18px;
  line-height: 14px;
  vertical-align: top;
  display: inline-block;
  transform: translateY(9px);
}
</style>
<style scoped>
.toolbar {
  /* border: none; */
  margin-bottom: 10px;
}

.flex {
  display: flex;
  gap: 4px;
}
.select {
  --p-select-sm-padding-x: 8px;
  &:deep(.dropdown) {
    width: min-content;
    margin-right: var(--p-select-sm-padding-x);
  }
}
</style>
