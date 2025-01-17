import type { StackMap, GuitarNote } from "~/model/data";
import type { EditingState } from "./provide-editing-state";
import type { SettingsState } from "./provide-settings-state";

export type CollapsedState = {
  collapsed: ComputedRef<Set<number>>;
};

const CollapsedStateInjectionKey = Symbol() as InjectionKey<CollapsedState>;

export function provideCollapsedState(
  props: ReactiveComputed<{
    editing: EditingState;
    settings: SettingsState;
    stackData: StackMap<GuitarNote>;
    beatSize: number;
  }>,
) {
  const isSubdivision = (position: number) => position % props.beatSize !== 0;

  const collapsed = computed<Set<number>>(() => {
    const positions = new Set<number>(
      [...props.stackData]
        .filter(([position, stack]) => {
          // if (expanded.has(position)) return false;
          if (props.editing.editingNote?.position === position) return false;
          if (props.settings.collapseAll) return true;
          if (props.settings.collapseEmpty && stack.size === 0) return true;
          if (props.settings.collapseSubdivisions && isSubdivision(position))
            return true;
        })
        .map(([position, _]) => position),
    );
    return positions;
  });

  provide(CollapsedStateInjectionKey, { collapsed });
  return collapsed;
}

export function injectCollapsedState() {
  const state = inject(CollapsedStateInjectionKey);
  if (!state) throw new Error("CollapsedState not provided");
  return state;
}
