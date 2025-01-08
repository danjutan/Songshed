<script lang="ts" setup>
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type Events = PickStartsWith<Parameters<typeof draggable>[0], "on">;

type DraggableProps = Omit<
  Parameters<typeof draggable>[0],
  "element" | keyof Events
>;
const props = defineProps<DraggableProps>();
const element = useTemplateRef("element");

type Emits = EmitsFromParameters<Events>;
const emit = defineEmits<Emits>();

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      draggable({
        ...props,

        element: element.value!,
        onDragStart: (args) => emit("dragStart", args),
        onDrag: (args) => emit("drag", args),
        onDrop: (args) => emit("drop", args),
        onGenerateDragPreview: (args) => emit("generateDragPreview", args),
      }),
    );
  });
});
</script>

<template>
  <div ref="element" class="draggable">
    <slot />
  </div>
</template>
