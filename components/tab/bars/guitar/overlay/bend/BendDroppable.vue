<script lang="ts" setup>
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getBendBarDropData } from "~/components/tab/hooks/dnd/types";

const props = defineProps<{
  position: number;
}>();

const droppable = useTemplateRef("droppable");

watchEffect((cleanup) => {
  if (!droppable.value) {
    return;
  }
  cleanup(
    dropTargetForElements({
      element: droppable.value!,
      getData: () => getBendBarDropData({ position: props.position }),
    }),
  );
});
</script>

<template>
  <div ref="droppable" class="bend-droppable" />
</template>

<style scoped>
/* .bend-droppable {
  background: blue;
  &:hover {
    background: red;
  }
} */
</style>
