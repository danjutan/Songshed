import { ref, onMounted, onBeforeUnmount, computed } from "vue";

export function useWindowResizing() {
  const lastWidth = ref(0);
  const resizeTimeout = ref<number | null>(null);
  const isResizing = ref(false);

  function onResize() {
    const currentWidth = window.innerWidth;
    if (lastWidth.value !== currentWidth) {
      isResizing.value = true;
      lastWidth.value = currentWidth;

      // Clear existing timeout
      if (resizeTimeout.value) {
        window.clearTimeout(resizeTimeout.value);
      }

      // Set new timeout to mark resize as complete after delay
      resizeTimeout.value = window.setTimeout(() => {
        isResizing.value = false;
      }, 150);
    }
  }

  // Add resize listener when mounted
  onMounted(() => {
    lastWidth.value = window.innerWidth;
    window.addEventListener("resize", onResize);
  });

  // Clean up on component unmount
  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    if (resizeTimeout.value) {
      window.clearTimeout(resizeTimeout.value);
    }
  });

  return {
    isResizing,
    lastWidth,
  };
}
