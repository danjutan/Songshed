<script lang="ts" setup>
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type Events = PickStartsWith<Parameters<typeof dropTargetForElements>[0], "on">;

type DroppableProps = Omit<
  Parameters<typeof dropTargetForElements>[0],
  "element" | keyof Events
>;
const props = defineProps<DroppableProps>();

type Emits = EmitsFromParameters<Events>;
const emit = defineEmits<Emits>();

const element = useTemplateRef("element");
onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      dropTargetForElements({
        ...props,
        element: element.value!,
        onDragEnter: (args) => emit("dragEnter", args),
        onDragStart: (args) => emit("dragStart", args),
        onDragLeave: (args) => emit("dragLeave", args),
        onDrag: (args) => emit("drag", args),
        onDrop: (args) => emit("drop", args),
        onDropTargetChange: (args) => emit("dropTargetChange", args),
        onGenerateDragPreview: (args) => emit("generateDragPreview", args),
      }),
    );
  });
});
</script>

<template>
  <div ref="element" class="drop-target">
    <slot />
  </div>
</template>
