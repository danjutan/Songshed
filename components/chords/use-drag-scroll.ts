export function useDragScroll(containerRef: Ref<HTMLElement | null>) {
  const isDragging = ref(false);
  let dragStartX = 0;
  let scrollStartX = 0;

  function onMouseDown(event: MouseEvent) {
    const container = containerRef.value;
    if (!container) return;

    isDragging.value = true;
    dragStartX = event.clientX;
    scrollStartX = container.scrollLeft;
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging.value) return;

    const container = containerRef.value;
    if (!container) return;

    const deltaX = dragStartX - event.clientX;
    container.scrollLeft = scrollStartX + deltaX;
  }

  function onMouseUp() {
    if (!isDragging.value) return;

    const container = containerRef.value;
    if (container) {
      container.style.scrollSnapType = "";
      container.style.cursor = "";
    }
    isDragging.value = false;
  }

  onMounted(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  });

  return {
    isDragging,
    onMouseDown,
  };
}
