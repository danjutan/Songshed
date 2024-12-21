<template>
  <div class="spacer-overlay">
    <div class="indicator-container">
      <div class="spacer-indicator">
        ⇤
      </div>
      <div class="spacer-indicator">
        ⇥
      </div>
    </div>
  </div>
</template>

<style>
.spacer-overlay {
  display: flex;
  /* height: calc(var(--cell-height) * v-bind(numStrings)); */
  height: 100%;
  /* width: 100%; */
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  /* position: absolute; */
}

.indicator-container {
  width: 100%;
  /* margin-top: calc(var(--cell-height) / 2); */
  height: calc(var(--cell-height) * 2);
  container-type: size;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
  cursor: pointer;
}

.spacer-overlay:hover {
  background-color: rgba(255, 0, 0, 0.1);
}

.spacer-overlay:hover .indicator-container {
  opacity: 0.6;
}

.spacer-indicator {
  /* margin-top: -50%; */
  font-size: clamp(10px, 50cqw, calc(var(--cell-height) * 2));
  color: rgb(255, 0, 0);
}

@container (aspect-ratio < 0.8) {
  .spacer-indicator {
    display: none;
  }
}

/* @container (aspect-ratio < 0.5){
  .spacer-overlay:hover {
    background-color: rgba(255, 0, 0, 0.5);
  }
} */
</style>
