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
  height: 100%;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.indicator-container {
  width: 100%;
  height: calc(var(--cell-height) * 2);
  container-type: size;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  display: none;
}

.spacer-overlay:hover .indicator-container {
  display: flex;
}

/*
  Remember that this is meant to overlay on top of drape downs, which already have a background color
*/
.spacer-overlay:hover {
  background-color: rgba(255, 0, 0, 0.1);
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
