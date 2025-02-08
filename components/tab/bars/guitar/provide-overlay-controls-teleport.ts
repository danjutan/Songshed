export function provideOverlayControlsTeleport() {
  const uniqueId = `overlay-controls-${useId()}`;

  // layers
  const draggersClass = "draggers";
  const selectsClass = "selects";

  const draggersSelector = `#${uniqueId} .${draggersClass}`;
  const selectsSelector = `#${uniqueId} .${selectsClass}`;

  const value = {
    uniqueId,
    draggersClass,
    selectsClass,
    draggersSelector,
    selectsSelector,
  };

  provide(overlayTeleportInjectionKey, value);
  return value;
}

const overlayTeleportInjectionKey = Symbol() as InjectionKey<
  ReturnType<typeof provideOverlayControlsTeleport>
>;

export function injectOverlayControlsTeleport() {
  return inject(overlayTeleportInjectionKey) as ReturnType<
    typeof provideOverlayControlsTeleport
  >;
}
