<script lang="ts" setup>
import type { GuitarNote } from "../data";

const props = withDefaults(
  defineProps<{
    data?: GuitarNote;
    tuning: Midi;
    frets: number;
    startFocused?: boolean;
    blockingColor?: string;
    hovering?: boolean;
  }>(),
  {
    data: undefined,
    blockingColor: "white",
  },
);

const emit = defineEmits<{
  noteChange: [data: Partial<GuitarNote>];
  noteDelete: [];
  startEdit: [];
  endEdit: [];
}>();

const input = ref<HTMLInputElement>();

function focus() {
  input.value!.focus();
  input.value!.select();
}

defineExpose({ focus });

const relativeNote = computed(() => {
  if (props.data) {
    return (props.data.midi - props.tuning) as Midi;
  }
  return "";
});

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.value.trim() == "") {
    return;
  }
  const num = parseInt(target.value);
  if (Number.isInteger(num)) {
    if (num < 1 || num > props.frets) {
      target.value = `${relativeNote.value}`;
      return;
    }
    emit("noteChange", { midi: (props.tuning + num) as Midi });
    return;
  }
  target.value = `${relativeNote.value}`;
}

function onInputBlur(e: Event) {
  const target = e.target as HTMLInputElement;
  if (props.data && target.value.trim() == "") {
    emit("noteDelete");
  }
}

function mouseOver() {
  emit("startEdit");
}

onMounted(() => {
  if (props.startFocused) {
    input.value?.focus();
  }
});
</script>

<template>
  <div
    class="note-input"
    :class="{ hovering }"
    @mouseover="mouseOver"
    @mouseleave="emit('endEdit')"
  >
    <span class="input-bg">{{ relativeNote }}</span>
    <input
      ref="input"
      :value="relativeNote"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{1,2}"
      @input="onInput"
      @click="focus"
      @blur="onInputBlur"
    />
  </div>
</template>

<style scoped>
.note-input {
  display: grid;
}

input {
  all: unset;
  /* text-shadow: 1px 1px 0px lightgray; */
  height: var(--cell-height);
  /* z-index: var(--z-index-notes); */
}

.input-bg,
input {
  grid-area: 1 / 1;
  font-size: var(--note-font-size);
  width: var(--note-font-size);
}

.input-bg {
  width: min-content;
  pointer-events: none;
  color: transparent;
  background-color: v-bind(blockingColor);
}

.hovering > input {
  background-color: var(--note-hover-color);
}

@container collapser (aspect-ratio < 0.5) {
  input {
    display: none;
  }
}
</style>
