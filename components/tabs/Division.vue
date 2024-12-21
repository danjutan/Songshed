<script lang="ts" setup>
import { mergeProps } from 'vue';
import type { NoteData, NoteStack } from './data';

const props = withDefaults(defineProps<{
  stacks: NoteStack[],
  frets: number,
  tuning: Midi[],
}>(), {
});

console.log(props.stacks);

const numString = computed(() => props.tuning.length);

const emit = defineEmits<{
  noteChange: [stackIndex: number, stringIndex: number, note: NoteData],
}>()

</script>

<template>
  <div class="division">
    <div v-for="(stack, stackIndex) in props.stacks" class="stack">
      <TabsNoteInput v-for="(tuning, i) in props.tuning" :data="stack[i]" :tuning
        :frets="props.frets" @dataChange="emit('noteChange', stackIndex, i, $event)" />
    </div>
  </div>
</template>

<style scoped>
.division {
  border: 1px dashed black;
  display: flex;
  grid-row: 1 / span v-bind(numString);
  overflow: hidden;
}

.stack {
  border-right: 1px solid red;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>