<script lang="ts" setup>
const props = defineProps<{
  lines?: boolean
  noteRadius: number
  cx: number
  cy: number
  midi: Midi
  color: string
  frameColor: string
  selected: boolean
}>();

const emit = defineEmits<{
  toggle: [to: boolean]
}>();

const text = computed(() =>
  getNoteInfo(props.midi).name,
);
</script>

<template>
  <g class="container"
     :class="{ selected: props.selected }"
     cursor="pointer"
     @click="emit('toggle', !props.selected)">
    <circle class="clip"
            :r="noteRadius"
            :cx="props.cx"
            :cy="props.cy"
            fill="white"
            stroke="none"
    />
    <circle class="cover"
            :r="noteRadius"
            :cx="props.cx"
            :cy="props.cy"
            :stroke="frameColor"
            fill="white"
    />
    <text :font-size="2 + noteRadius - 2 * text.length + 'pt'"
          fill="white"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="sans-serif"
          :x="props.cx"
          :y="props.cy">
      {{ text }}
    </text>
  </g>
</template>

<style scoped>
text {
  user-select: none;
}

.container:hover text{
  fill: white;
}

.selected .cover {
  stroke: none;
  fill: v-bind(color)
}
.container:hover .cover {
  stroke: v-bind(color);
  fill: v-bind(color);
  fill-opacity: 0.6;
}
</style>
