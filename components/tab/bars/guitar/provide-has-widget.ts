export function provideHasWidget(hasWidget: { value: boolean }) {
  provide(hasWidgetInjectionKey, hasWidget);
  return hasWidget;
}

const hasWidgetInjectionKey = Symbol() as InjectionKey<
  ReturnType<typeof provideHasWidget>
>;

export function injectHasWidget() {
  return inject(hasWidgetInjectionKey) as ReturnType<typeof provideHasWidget>;
}
