<script lang="ts" setup>
import { injectSettingsState } from "./providers/state/provide-settings-state";

const props = defineProps<{
  minSubdivision: number;
}>();

const settings = injectSettingsState();

const noteHTML = (unicode: string) =>
  `<span style="font-family: 'Leland Text', serif; font-size: 20px; display: inline-block;">${unicode}</span>`;

const subdivisionsOptions = computed(() => {
  const options = [
    { label: `1: ${noteHTML("&#x1D15F;")}`, value: 1 },
    { label: `2: ${noteHTML("&#x1D160;")}`, value: 2 },
    { label: `4: ${noteHTML("&#x1D161;")}`, value: 4 },
    { label: `8: ${noteHTML("&#x1D162;")}`, value: 8 },
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
  <Toolbar>
    <template #start>
      <FloatLabel variant="on">
        <Select
          id="subdivisions"
          v-model="settings.subdivisions"
          class="select"
          size="small"
          option-label="label"
          option-value="value"
          :options="subdivisionsOptions"
        >
          <template #option="{ option }">
            <span v-html="option.label" />
          </template>
          <template #value="{ value }">
            <span v-html="optionsMap[value]" />
          </template>
        </Select>
        <label for="subdivisions">Beat Columns</label>
      </FloatLabel>
    </template>
    <template #center />
    <template #end />
  </Toolbar>
</template>

<style scoped>
.select {
  /* font-family: "Leland Text", serif !important; */
  /* width: 100px; */
}
</style>
