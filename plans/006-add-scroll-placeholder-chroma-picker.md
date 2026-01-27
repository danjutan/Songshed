# Plan: Add "scroll ->" Placeholder to Chroma Picker

**Date:** 2025-01-27
**Branch:** chord-select

## Summary

Add a placeholder item "scroll ->" as the first element in the chroma picker. When this placeholder is selected (initial state), the suffix picker should be empty, diagrams should be empty, and no chord title should be emitted. Once a real note is selected, scrolling back to the placeholder has no effect (the last real selection is preserved).

## Implementation

### File: `/components/chords/ChordSelect.vue`

1. **Add placeholder to items array**:
   ```typescript
   const CHROMA_PLACEHOLDER = "scroll ->";
   const CHROMA_PICKER_ITEMS = [CHROMA_PLACEHOLDER, ...CHROMATIC_NOTES];
   ```

2. **Track real selection separately**:
   ```typescript
   const selectedPickerItem = ref(CHROMA_PLACEHOLDER);
   const activeChroma = ref<string | null>(null);

   // Update activeChroma only when a real note is selected
   watch(selectedPickerItem, (item) => {
     if (item !== CHROMA_PLACEHOLDER) {
       activeChroma.value = item;
     }
   });
   ```

3. **Update chromaIndex to use activeChroma**:
   ```typescript
   const chromaIndex = computed(() => {
     if (activeChroma.value === null) return null;
     return CHROMATIC_NOTES.indexOf(activeChroma.value) as Chroma;
   });
   ```

4. **Guard computed properties**:
   ```typescript
   const suffixes = computed(() => {
     if (chromaIndex.value === null) return [];
     return getSuffixesForChroma(chromaIndex.value);
   });

   const voicings = computed(() => {
     if (chromaIndex.value === null) return [];
     return getChordsFromDb(chromaIndex.value, selectedSuffix.value);
   });
   ```

5. **Guard title computation and emission**:
   ```typescript
   const selectedTitle = computed(() => {
     if (activeChroma.value === null) return null;
     const suffix = formatSuffixForTitle(selectedSuffix.value);
     return `${activeChroma.value}${suffix}`;
   });

   watch(selectedTitle, (title) => {
     if (title !== null) {
       emit("update:title", title);
     }
   });
   // Remove immediate: true to prevent emission on mount
   ```

6. **Update template to pass placeholder styling flag**:
   ```vue
   <ScrollPicker
     v-model="selectedPickerItem"
     class="chroma-picker"
     :items="CHROMA_PICKER_ITEMS"
     :placeholder-item="CHROMA_PLACEHOLDER"
     name="chord-chroma"
   />
   ```

### File: `/components/chords/ScrollPicker.vue`

1. **Add optional placeholder prop**:
   ```typescript
   interface Props {
     items: string[];
     name: string;
     placeholderItem?: string;
   }
   ```

2. **Add conditional styling class**:
   ```vue
   <label
     ...
     :class="{
       selected: model === item,
       placeholder: item === placeholderItem
     }"
   >
   ```

3. **Add placeholder CSS** (dimmed/muted appearance):
   ```css
   .scroll-item.placeholder {
     opacity: 0.5;
     font-style: italic;
   }
   ```

## Verification

1. Open the chord picker - should show "scroll ->" centered, no suffix picker visible, no diagram visible
2. Scroll right to select "C" - suffix picker appears with options, diagram appears
3. Scroll back to "scroll ->" - suffix and diagram remain visible with previous selection
4. Verify chord title is not emitted until a real note is selected

## Prompts

The first element in the chroma picker should just be text that says "scroll ->" and it should not change the chord title. Thus when you first open the chord picker, the suffixes and diagrams are empty and the chord title has not yet changed.

## Follow-up Prompts

When we're on that first "scroll ->" state, we should show the other two rows as if they were on C major, but they should be grayed out.
