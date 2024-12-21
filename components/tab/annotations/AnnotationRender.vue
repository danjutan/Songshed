<script setup lang="ts">
import type { Annotation } from "~/model/data";

const props = defineProps<{
  row: number;
  startColumn: number;
  endColumn: number;
  annotation?: Annotation;
}>();

const emit = defineEmits<{
  updateTitle: [string];
  delete: [];
}>();

const pointerEvents = computed(() => (props.annotation ? "auto" : "none"));

const titleEl = ref<HTMLDivElement>();

function titleInput() {
  if (props.annotation) {
    const value = titleEl.value!.innerText;
    emit("updateTitle", value);
  }
}

function titleFocus() {
  window.getSelection()?.selectAllChildren(titleEl.value!);
  titleEl.value!.scrollTo({ left: 0 });
}

watch(
  () => props.annotation,
  (data) => {
    if (data) {
      setTimeout(() => titleEl.value!.focus(), 1);
    }
  },
);
</script>

<template>
  <div :class="`annotation annotation-${row}`">
    <div ref="titleEl" class="title" contenteditable @input="titleInput" @focus="titleFocus">
      {{ annotation?.title }}
    </div>
    <div v-if="annotation" class="delete" @click="emit('delete')">&Cross;</div>
  </div>
</template>

<style scoped>
.annotation {
  display: flex;
  align-items: center;
  border-right: 1px solid gray;
  grid-column-start: v-bind(startColumn);
  grid-column-end: v-bind(endColumn);
  grid-row: v-bind(row);
  background-color: lightblue;
  pointer-events: v-bind(pointerEvents);

  &:hover {
    .delete {
      visibility: visible;
    }
  }
}

.title {
  overflow: hidden;
  white-space: nowrap;
  /* text-overflow: ellipsis; */
  flex-grow: 1;
  text-align: center;
}

.delete {
  color: maroon;
  cursor: pointer;
  padding: 0px 1px;
  visibility: hidden;
  &:hover {
    font-weight: bold;
    color: darkred;
  }
}
</style>
