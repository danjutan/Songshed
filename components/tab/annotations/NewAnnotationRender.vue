<script lang="ts" setup>
import AnnotationRender from "./AnnotationRender.vue";

export interface NewAnnotationRenderProps {
  row: number;
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
    :start-at-left="startAtLeft"
    :end-at-right="endAtRight"
  />
</template>
