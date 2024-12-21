<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";
import {
  SelectionInjectionKey,
  type SelectionState,
} from "./providers/selection-state";
import {
  TieAddInjectionKey,
  type TieAddState,
} from "./providers/tie-add-state";
import {
  EditingInjectionKey,
  type EditingState,
} from "./providers/editing-state";

const props = withDefaults(
  defineProps<{
    data?: GuitarNote;
    string: number;
    position: number;
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
  // TODO: remove if unused
  focus: [];
  blur: [];
}>();

const { editingNote, setEditing } = inject(EditingInjectionKey) as EditingState;

const tieAdd = inject(TieAddInjectionKey) as TieAddState;

const input = ref<HTMLInputElement>();

function focus() {
  input.value!.focus();
  input.value!.select();
  setEditing(props.string, props.position);
  emit("focus");
}

const editing = computed(
  () =>
    editingNote?.position === props.position &&
    editingNote?.string === props.string,
);

defineExpose({ focus });

function onBlur(e: Event) {
  emit("blur");
}

const relativeNote = computed(() => {
  if (props.data) {
    return (props.data.midi - props.tuning) as Midi;
  }
  return "";
});

const hasNote = computed(() => relativeNote.value !== "");

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.value.trim() == "") {
    emit("noteDelete");
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

onMounted(() => {
  if (props.startFocused) {
    focus();
  }
});

function onClick(e: MouseEvent) {
  focus();
}

function onSideMouseDown(e: MouseEvent) {
  tieAdd.start(props.string, props.position, props.data!.midi!);
  e.stopImmediatePropagation();
}
</script>

<template>
  <div class="note-input" :class="{ hovering, editing, 'has-note': hasNote }">
    <span class="input-bg">{{ relativeNote }}</span>
    <div
      v-if="editing && relativeNote"
      class="side left"
      :class="{
        hidden:
          tieAdd.dragDirection === 'left' || tieAdd.hasLeft(string, position),
      }"
      @mousedown="onSideMouseDown"
    >
      <span>&ldca;</span>
    </div>
    <input
      ref="input"
      :value="relativeNote"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{1,2}"
      @input="onInput"
      @blur="onBlur"
      @click="onClick"
      @keyup="(e) => e.stopPropagation()"
    />
    <div
      v-if="editing && hasNote"
      class="side right"
      :class="{
        hidden:
          tieAdd.dragDirection === 'right' || tieAdd.hasRight(string, position),
      }"
      @mousedown="onSideMouseDown"
    >
      <span>&rdca;</span>
    </div>
  </div>
</template>

<style scoped>
.note-input {
  /* Font size set by parent, Stack */
  display: grid;
  justify-items: center;
  align-items: center; /*comment this if you want other centering*/
  grid-template-columns: 1fr 1fr 1fr;
}

.side {
  /* background-color: v-bind(blockingColor); */
  cursor: crosshair;
  grid-row: 1;
  /* width: calc(var(--note-font-size) / 2); */
  height: 100%;
  display: flex;
  align-items: end;

  &.hidden {
    visibility: hidden;
  }

  &:hover {
    background-color: var(--note-hover-color);
  }

  &.left {
    grid-column: 1;
  }

  &.right {
    grid-column: 3;
  }

  & span {
    transform: translateY(3px);
  }
}

input {
  all: unset;
  height: var(--cell-height);
}

.input-bg,
input {
  grid-area: 1 / 2;
  /* font-size: var(--note-font-size); */
  text-align: center; /*comment this if you want other centering*/
}

input {
  width: var(--cell-height);
}

.has-note.focused input {
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
