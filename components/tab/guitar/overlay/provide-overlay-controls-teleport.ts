export function provideOverlayControlsTeleport() {
  const uniqueId = `overlay-controls-${useId()}`;
  const overlayControlsSelector = `#${uniqueId}`;
  provide(overlayTeleportInjectionKey, { overlayControlsSelector });
  return uniqueId;
}
const overlayTeleportInjectionKey = Symbol() as InjectionKey<{
  overlayControlsSelector: string;
}>;

export function injectOverlayControlsTeleport() {
  return inject(overlayTeleportInjectionKey) as {
    overlayControlsSelector: string;
  };
}
