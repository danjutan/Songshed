<script lang="ts" setup>
import { Pencil, Plus } from "lucide-vue-next";

const props = defineProps<{
  withBends?: boolean;
  lastRow?: boolean;
}>();
</script>

<template>
  <div class="new-row-button">
    <Pencil class="pencil" />
    <Plus class="plus" />
  </div>
</template>

<style scoped>
.new-row-button {
  border-right: none;
  width: min-content;
  cursor: pointer;
  height: var(--cell-height);

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
    width: calc(var(--cell-height) * 2 / 3);
    height: calc(var(--cell-height) * 2 / 3);
  }

  & .plus {
    grid-area: 1 / 1;
    align-self: center;
    justify-self: end;
    transform: translateX(20%) translateY(calc(var(--cell-height) / 4));
    width: calc(var(--cell-height) / 2);
    height: calc(var(--cell-height) / 2);
    /* align-self: center;
    justify-self: start;
    transform: translateX(-25%) translateY(-10%); */
  }
}
</style>
