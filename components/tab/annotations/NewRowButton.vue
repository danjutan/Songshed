<script lang="ts" setup>
import { Pencil, Plus } from "lucide-vue-next";

const props = defineProps<{
  withBends?: boolean;
  lastRow?: boolean;
}>();
</script>

<template>
  <div class="new-row-button">
    <Pencil :size="16" class="pencil" />
    <Plus :size="11" class="plus" />
  </div>
</template>

<style scoped>
.new-row-button {
  grid-row: 1;
  grid-column: 1;
  font-size: var(--cell-height);
  border-right: none;
  width: min-content;
  cursor: pointer;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;

  &:hover {
    & svg {
      stroke-width: 2.5;
    }
  }

  & .pencil {
    grid-area: 1 / 1;
    align-self: center;
  }

  & .plus {
    grid-area: 1 / 1;
    align-self: center;
    justify-self: end;
    transform: translateX(20%) translateY(40%);
    /* align-self: center;
    justify-self: start;
    transform: translateX(-25%) translateY(-10%); */
  }
}
</style>
