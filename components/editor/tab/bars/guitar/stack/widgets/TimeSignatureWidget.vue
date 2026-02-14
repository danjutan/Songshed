<script lang="ts" setup>
import OverlaySelect from "@/components/editor/tab/bars/guitar/overlay/OverlaySelect.vue";
import { injectSpacingsState } from "~/components/editor/providers/provide-spacings";
import { X } from "lucide-vue-next";
import { SPACING, type SpacingValue } from "~/theory/spacing";

const props = defineProps<{
  first?: boolean;
}>();

const { cellHeightPx } = injectSpacingsState();

const emit = defineEmits<{
  delete: [];
}>();

const beatsGlyphs = [
  "&#xE081;",
  "&#xE082;",
  "&#xE083;",
  "&#xE084;",
  "&#xE085;",
  "&#xE086;",
  "&#xE087;",
  "&#xE088;",
  "&#xE089;",
  "&#xE081;&#xE080;",
  "&#xE081;&#xE081;",
  "&#xE081;&#xE082;",
  "&#xE081;&#xE083;",
  "&#xE081;&#xE084;",
  "&#xE081;&#xE085;",
  "&#xE081;&#xE086;",
];

const beatValueGlyphs = [
  beatsGlyphs[0],
  beatsGlyphs[1],
  beatsGlyphs[3],
  beatsGlyphs[7],
  beatsGlyphs[0] + beatsGlyphs[5],
  beatsGlyphs[2] + beatsGlyphs[3],
  beatsGlyphs[7] + beatsGlyphs[5],
];

const beatsOptions = beatsGlyphs.map(
  (glyph, i) =>
    [i + 1, `<span class="time-signature-glyph">${glyph}</span>`] as [
      number,
      string,
    ],
);

const beatValueOptions = beatValueGlyphs.map(
  (glyph, i) =>
    [2 ** i, `<span class="time-signature-glyph">${glyph}</span>`] as [
      number,
      string,
    ],
);

const numberToSpacing: Record<number, SpacingValue> = {
  1: SPACING.Whole,
  2: SPACING.Half,
  4: SPACING.Quarter,
  8: SPACING.Eighth,
  16: SPACING.Sixteenth,
  32: SPACING.ThirtySecond,
  64: SPACING.SixtyFourth,
  128: SPACING.OneTwentyEighth,
};

const spacingToNumber = Object.fromEntries(
  Object.entries(numberToSpacing).map(([number, spacing]) => [
    spacing,
    +number,
  ]),
) as Record<SpacingValue, number>;

const beats = defineModel<number>("beats");
const beatValue = defineModel<number>("beatValue", {
  get(value) {
    return spacingToNumber[value as SpacingValue];
  },
  set(value) {
    return numberToSpacing[value];
  },
});

const optionStyles = computed(() => ({
  fontSize: `calc(${cellHeightPx.value})`,
  lineHeight: `calc(${cellHeightPx.value} * 0.35)`,
  transform: `translateY(calc(${cellHeightPx.value} * -0.12))`,
}));
</script>

<template>
  <div class="widget">
    <X v-if="!first" :size="16" class="delete-button" @click="emit('delete')" />
    <OverlaySelect
      v-model="beats"
      class="overlay-select"
      :options="beatsOptions"
      :active="false"
      :option-styles="optionStyles"
    />
    <OverlaySelect
      v-model="beatValue"
      class="overlay-select"
      :options="beatValueOptions"
      :active="false"
      :option-styles="optionStyles"
    />
  </div>
</template>

<style>
.time-signature-glyph {
  font-family: "Leland", serif;
  font-size: calc(var(--cell-height) * 2);
  line-height: var(--cell-height);
  /* font-size: 18px;
  line-height: 14px;
  vertical-align: top;
  display: inline-block;
  transform: translateY(9px); */
}
</style>
<style scoped>
.widget {
  grid-row: 1 / -1;
  align-self: center;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-top: 14px;
  margin-top: -14px;

  &:deep(.label) {
    background-color: var(--tab-background-color);
  }

  &:not(:hover) .delete-button {
    display: none;
  }
}

.overlay-select {
  --p-select-sm-padding-y: 0px;
  padding: 2px;
}

.delete-button {
  cursor: pointer;
  position: absolute;
  left: calc(var(--cell-height) - var(--cell-height) / 4);
  top: 0px;
  background-color: var(--tab-background-color);
  color: var(--gray-note-color);
  &:hover {
    color: var(--p-content-color);
  }
  /* position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10; */
}
</style>
