<script lang="ts" setup>
import AnnotationRender from "~/components/editor/tab/annotations/AnnotationRender.vue";

export interface NewAnnotationRenderProps {
  row: number;
  renderRow: number;
  start: number;
  end: number;
  startAtLeft?: number;
  endAtRight?: number;
}

const props = defineProps<NewAnnotationRenderProps>();
</script>

<template>
  <AnnotationRender
    creating
    :annotation="{ start, end, text: '' }"
    :row="row"
    :render-row="renderRow"
    :start-at-left="startAtLeft"
    :end-at-right="endAtRight"
  />
</template>
